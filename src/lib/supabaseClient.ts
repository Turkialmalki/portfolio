/**
 * THE ONLY SUPABASE CLIENT ON THE SITE — and the only two Supabase values
 * that are allowed in the static frontend.
 *
 * `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are
 * inlined into the exported bundle at build time — that is what
 * `NEXT_PUBLIC_` means in a static export — so treat them as public by
 * definition, the same way the GTM container id already is. The publishable
 * key is meant to be public: every privileged action it can reach is gated
 * by Postgres Row Level Security or by an Edge Function that re-checks the
 * caller, never by the key being secret.
 *
 * What must NEVER be imported here, in any client component, or in anything
 * that ships to the browser: the Supabase service role key, the AI provider
 * key, or `ADMIN_API_KEY` (gates `verify-payment` — see
 * `docs/backend-architecture.md`). Those live only in Edge Function
 * environment variables — see `supabase/functions/` and `.env.example` for
 * the full split.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * `null` until both env vars are set (e.g. before the Supabase project is
 * provisioned in this environment). Every caller must handle that case —
 * the Career product not being configured yet must never throw and take
 * down an unrelated page in this same static export.
 */
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          // Magic-link / OTP only for MVP — no password grant is offered in
          // the UI, so persisted-session handling is all this needs.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
