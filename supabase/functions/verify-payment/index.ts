/**
 * verify-payment — the ONLY place a purchase becomes "verified" and the
 * ONLY place an entitlement is granted for it.
 *
 * Not reachable from the browser with a user session: there is deliberately
 * no "is this user an admin" flag anywhere yet (no role table, no claim),
 * so a stolen or forged user session can never authenticate here. Instead
 * this function is gated by `ADMIN_API_KEY` — a backend-only secret held
 * by whatever trusted tool calls it later (an internal admin script or
 * dashboard; neither exists yet, per the brief: no admin UI is being built
 * in this command). Missing or wrong key → `403`, no further processing.
 *
 * The actual state transition and entitlement grant run inside a single
 * Postgres function (`verify_payment`, see the migration) under a row
 * lock, so two concurrent calls — an admin double-clicking "verify" —
 * cannot grant the entitlement twice. Calling this again on an
 * already-decided purchase is a safe no-op, not an error.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY");

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

  const providedKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || !providedKey || !timingSafeEqual(providedKey, ADMIN_API_KEY)) {
    // Deliberately generic, same reasoning as lemon-webhook's old
    // invalid_signature response: never tell a probing caller which part
    // of the check failed.
    return jsonResponse({ error: "forbidden" }, 403, headers);
  }

  let body: { purchase_id?: string; decision?: "verified" | "rejected"; verified_by?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, headers);
  }
  if (!body.purchase_id || !body.decision) {
    return jsonResponse({ error: "missing_fields" }, 400, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin.rpc("verify_payment", {
    p_purchase_id: body.purchase_id,
    p_decision: body.decision,
    p_verified_by: body.verified_by ?? "admin",
  });

  if (error) {
    const status = error.message.includes("purchase_not_found")
      ? 404
      : error.message.includes("purchase_not_awaiting_verification")
        ? 409
        : error.message.includes("invalid_decision")
          ? 400
          : 500;
    return jsonResponse({ error: error.message }, status, headers);
  }

  return jsonResponse({ ok: true, purchase: data }, 200, headers);
});
