/**
 * create-purchase — the missing first step of PAYMENT → VERIFICATION →
 * VERIFIED PURCHASE → ENTITLEMENT (see `docs/backend-architecture.md` and
 * `supabase/functions/_shared/productKeys.ts`'s note on "the not-yet-built
 * purchase-creation step"). Nothing before this command created the
 * `purchases` row that `request-payment-verification` needs a `purchase_id`
 * for — a customer clicking "pay" had no way to later attach a PayPal
 * reference to their own account.
 *
 * This function does exactly one thing: given an authenticated user and a
 * known product key, return a `pending` purchase row belonging to them —
 * reusing an existing pending/rejected one instead of piling up duplicates
 * on repeated clicks. It NEVER marks anything paid or verified, and the
 * price it records comes ONLY from `_shared/careerPricing.ts` — never from
 * anything the client sends — so a tampered request can't create a $0
 * purchase or influence what a later admin sees as the expected amount.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { CAREER_PRODUCT_PRICING } from "../_shared/careerPricing.ts";

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

  let body: { product_key?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, headers);
  }

  const productKey = body.product_key;
  const price = typeof productKey === "string" ? CAREER_PRODUCT_PRICING[productKey] : undefined;
  if (!productKey || !price) {
    // Deliberately generic — "unknown product" and "no price configured
    // yet" look identical to the caller, same reasoning as verify-payment's
    // forbidden response.
    return jsonResponse({ error: "unknown_product" }, 400, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Reuse an existing pending/rejected purchase for this user+product
  // instead of creating a duplicate on every click/back-navigation.
  const { data: existing, error: existingError } = await admin
    .from("purchases")
    .select("id, status, expected_amount, currency, product_key")
    .eq("user_id", user.id)
    .eq("product_key", productKey)
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    safeLogError({ event: "create_purchase_lookup_failed", user_id: user.id, error_code: "INTERNAL_ERROR" });
    return jsonResponse({ error: "internal_error" }, 500, headers);
  }

  if (existing) {
    safeLog({ event: "create_purchase_reused", user_id: user.id, purchase_id: existing.id });
    return jsonResponse({ ok: true, purchase: existing }, 200, headers);
  }

  const { data: created, error: insertError } = await admin
    .from("purchases")
    .insert({
      user_id: user.id,
      provider: price.provider,
      product_key: productKey,
      status: "pending",
      expected_amount: price.amount,
      currency: price.currency,
    })
    .select("id, status, expected_amount, currency, product_key")
    .single();

  if (insertError || !created) {
    safeLogError({ event: "create_purchase_insert_failed", user_id: user.id, error_code: "INTERNAL_ERROR" });
    return jsonResponse({ error: "internal_error" }, 500, headers);
  }

  safeLog({ event: "create_purchase_created", user_id: user.id, purchase_id: created.id });
  return jsonResponse({ ok: true, purchase: created }, 200, headers);
});
