import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * THE SHARED, PROVIDER-AGNOSTIC ENTITLEMENT GRANT.
 *
 * Every payment path that can ever produce a verified purchase — today's
 * manual PayPal verification, tomorrow's automated PayPal API webhook, a
 * reinstated Lemon Squeezy, a one-off manual admin comp — calls this SAME
 * function with the SAME three arguments. None of it knows or needs to know
 * how the purchase was verified; it only trusts that verification already
 * happened before this was called. Today the only caller is the
 * `verify_payment` Postgres function (see the migration), reached through
 * `verify-payment`'s admin-only Edge Function.
 *
 * Idempotency lives in Postgres, not here: the underlying `grant_entitlement`
 * SQL function is backed by a unique index on
 * `(user_id, product_key, source_order_id)`, so calling this twice for the
 * same purchase returns the same row rather than creating a second
 * entitlement — safe even under concurrent calls, not just sequential ones.
 *
 * `client` must be a service-role client. The underlying RPC is revoked
 * from `anon` and `authenticated` in the migration, so a browser — even an
 * authenticated one — cannot call this path directly.
 */
export async function grantEntitlement(
  client: SupabaseClient,
  args: { userId: string; productKey: string; sourcePurchaseId: string },
) {
  const { data, error } = await client.rpc("grant_entitlement", {
    p_user_id: args.userId,
    p_product_key: args.productKey,
    p_source_purchase_id: args.sourcePurchaseId,
  });
  if (error) throw error;
  return data;
}
