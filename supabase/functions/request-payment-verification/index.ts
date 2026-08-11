/**
 * request-payment-verification — the ONLY way a purchase can move from
 * "pending" (or "rejected", allowing resubmission) into
 * "verification_requested".
 *
 * This function NEVER marks a purchase verified and NEVER grants anything.
 * Its entire job is to record what the customer says they paid — a PayPal
 * transaction reference and/or the email they paid from — and flip the
 * purchase into "awaiting a human". The actual verification, and the
 * entitlement grant that follows it, happens only in `verify-payment`,
 * reachable only by a trusted admin. See
 * `docs/backend-architecture.md` for the full PAYMENT → VERIFICATION →
 * VERIFIED PURCHASE → ENTITLEMENT chain this is step one of.
 *
 * ── AUTH, TWICE ───────────────────────────────────────────────────────────
 * The caller must present a real Supabase user session — forwarded here as
 * the `Authorization` header and checked with `auth.getUser()` against the
 * anon-key client, which is what actually validates the JWT with GoTrue.
 * The user id this function passes on as the purchase's owner is the one
 * JUST VERIFIED that way, never anything the request body claims.
 *
 * Ownership is then checked a SECOND time, independently, inside
 * `request_payment_verification()` in Postgres (see the migration) — so a
 * bug in this function's own logic alone could not let User A touch User
 * B's purchase; the database enforces it too.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "unauthenticated" }, 401, headers);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "unauthenticated" }, 401, headers);
  }

  let body: { purchase_id?: string; reference?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, headers);
  }
  if (!body.purchase_id) {
    return jsonResponse({ error: "missing_purchase_id" }, 400, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin.rpc("request_payment_verification", {
    p_purchase_id: body.purchase_id,
    p_user_id: user.id, // from the verified session — never from the request body
    p_reference: body.reference ?? null,
    p_email: body.email ?? null,
  });

  if (error) {
    const status = error.message.includes("not_owner")
      ? 403
      : error.message.includes("purchase_not_found")
        ? 404
        : error.message.includes("purchase_not_eligible")
          ? 409
          : 500;
    return jsonResponse({ error: error.message }, status, headers);
  }

  return jsonResponse({ ok: true, purchase: data }, 200, headers);
});
