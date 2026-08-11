# Career backend — architecture foundation (Commands 01B + 01C)

Infrastructure only. No AI analysis, no pricing UI, no Career Pass, no
CV rewrite, no LinkedIn analyzer, no PayPal SDK. See `AGENTS.md` before
touching any Next.js code in this repo — it is not the Next.js in your
training data.

**Command 02 added the privacy/consent/deletion layer this document
doesn't cover** — the `knowledge` schema, `user_consents`, deletion audit
trail, `delete-resume`/`delete-career-data` Edge Functions, and
`/career/privacy`. See [docs/career-privacy.md](career-privacy.md) for all
of that; this document is left as the 01B/01C record and only lightly
corrected below where Command 02 made a prior "not built yet" note stale.

**01C correction:** Lemon Squeezy is retired as the Career MVP's payment
provider. The active provider is a **PayPal payment link**, verified
**manually** by a trusted admin — not an automated webhook. Everything
below reflects that; where something changed from 01B, it says so.

## Why a backend at all

`turkialmalki.com` is a Next.js **static export** (`output: "export"` in
[next.config.ts](../next.config.ts)) deployed to **GitHub Pages**. There is
no server, no API route, no auth, nothing that can hold a secret or enforce
a permission — every byte the site ships is public by construction. The
Career product needs private CV uploads, AI analysis, accounts, saved
reports, payment entitlements, usage limits and deletion controls — none of
which can exist safely in that model. Supabase is the backend; the
marketing site's deployment does not change.

```
turkialmalki.com (Next.js static export, GitHub Pages)
        │  fetch(), only the URL + publishable key
        ▼
Supabase (Postgres + Auth + Storage + Edge Functions)
        │  server-side only, secrets never leave here
        ▼
AI provider   (not called yet)
```

Payment is a **separate chain**, deliberately not drawn through an AI
provider or a webhook:

```
Career payment
  PayPal payment link (src/config/payments.ts)
        │  customer pays, then tells us so ("I've paid")
        ▼
  VERIFICATION            request-payment-verification (Edge Function)
        │  purchase.status: pending → verification_requested
        ▼
  a trusted human looks at it            (no admin tool built yet)
        │
        ▼
  VERIFIED PURCHASE       verify-payment (Edge Function, admin-only)
        │  purchase.status → verified, verified_at, verified_by
        ▼
  ENTITLEMENT             grant_entitlement() (Postgres, service-role only)
```

A PayPal **click**, a **redirect** back to the site, a **query parameter**,
and **localStorage** are all things a visitor can produce without paying —
none of them appear anywhere in this chain, and none of them can unlock
anything. The only two things that can change a purchase's status are the
two Edge Functions above, and only `verify-payment` can ever produce
`verified`.

## Security model

**In the browser, ever:** `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nothing else. The PayPal payment
link itself (`src/config/payments.ts`) is not a secret — it's a public URL
anyone can already see on paypal.com.

**Never in the browser, only as Edge Function secrets:**
`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`, `AI_PROVIDER_API_KEY`,
`ADMIN_API_KEY`. (01C: `LEMON_SQUEEZY_WEBHOOK_SECRET` and
`LEMON_SQUEEZY_API_KEY` are removed — see "What changed" below. No PayPal
API credential exists yet either; this MVP has no automated PayPal
integration.)

Every table has RLS **enabled and forced**. Every policy scopes to
`auth.uid()` — there is no "authenticated users can select everything"
policy anywhere in the migrations. All privileged writes (analyses,
entitlements, purchase verification/state changes) happen only from Edge
Functions running under the service role or through two Postgres functions
whose `EXECUTE` privilege is revoked from `anon`/`authenticated` — see
"Payment verification, in Postgres" below. The client has SELECT-only
access to `purchases` and `entitlements`; it cannot INSERT, UPDATE, or
DELETE either table directly, and it cannot call the privileged RPCs
directly either.

## Database

| Table | Purpose | Write path |
|---|---|---|
| `profiles` | 1 row per user | trigger on `auth.users` insert |
| `resumes` | CV metadata (file lives in Storage) | client insert (own row); soft-delete only |
| `resume_analyses` | AI scan results | Edge Function (service role) only |
| `entitlements` | what a user is allowed to do | `grant_entitlement()` (service-role RPC) only |
| `purchases` | payment/verification lifecycle | client can SELECT own rows only; state changes only via the two privileged RPCs below |

Product **definitions** (name, price, copy) stay code/config-driven in
`src/config/careerProducts.ts` (Command 01A) and `src/config/payments.ts`
(Command 01C, payment link + expected price) — only the internal
`product_key` string is ever persisted in Postgres, via
`supabase/functions/_shared/productKeys.ts`.

### `purchases`, corrected for manual verification (01C)

The 01B schema assumed an automated webhook that could say "paid,
definitively, right now." Manual PayPal verification has no such signal —
a purchase sits in `verification_requested` until a human looks at it. The
01C migration ([20260812100001_generic_payment_verification.sql](../supabase/migrations/20260812100001_generic_payment_verification.sql))
changes:

- `provider` check widens to `paypal | lemon_squeezy | manual` (provider
  column was always plain text and provider-neutral by design — only the
  *allowed values* changed).
- `status` vocabulary becomes `pending | verification_requested | verified
  | rejected | refunded` (replacing `pending | paid | refunded | failed`).
- `provider_order_id` and `provider_product_id` become nullable — a PayPal
  payment link has neither at purchase-creation time.
- `amount` is renamed `expected_amount` (numeric) — it now means "what the
  product should cost," matching `payments.ts`'s `expectedPrice`, not "what
  a webhook confirmed was charged."
- New columns: `customer_submitted_reference`, `customer_submitted_email`
  (what the customer types into "I've paid"; not proof by itself),
  `verified_at`, `verified_by` (set only by `verify_payment()`).
- `raw_reference` (jsonb, already existed) doubles as `provider_metadata` —
  no duplicate column added.

`unique (provider, provider_order_id)` still stands from 01B and still
works with a nullable `provider_order_id`: Postgres treats each `NULL` as
distinct, so multiple pending PayPal purchases with no order id yet never
collide, while a future automated provider that always sets an order id
still gets the original idempotency guarantee.

## Payment verification, in Postgres

Three `security definer` functions, all with `EXECUTE` **revoked from
`PUBLIC`** and granted only to `service_role` — this is the detail that
makes "trusted admin only" and "user cannot call trusted payment
verification logic" actually true rather than assumed. Every new Postgres
function is executable by `PUBLIC` (i.e. `anon` and `authenticated`, via
PostgREST) unless that grant is explicitly revoked; without the `revoke`
line, `supabase.rpc('verify_payment', …)` would work from any browser with
nothing but the publishable key. This was checked against a running local
instance, not assumed — see Security Test Results, item E.

- **`grant_entitlement(user_id, product_key, source_purchase_id)`** — the
  shared, provider-agnostic grant (Part 10). Backed by a unique index
  `entitlements (user_id, product_key, source_order_id) WHERE source_order_id
  IS NOT NULL`, so calling it twice for the same purchase returns the same
  row rather than creating a second entitlement — safe under concurrent
  calls, not just sequential ones. `supabase/functions/_shared/grantEntitlement.ts`
  is the thin Deno wrapper other Edge Functions should call through.
- **`request_payment_verification(purchase_id, user_id, reference, email)`**
  — row-locks the purchase, checks `purchase.user_id = user_id` (the id is
  supplied by the calling Edge Function from an already-verified JWT, never
  trusted from a request body), checks status is `pending` or `rejected`
  (allowing resubmission), then sets `verification_requested` and stores
  what the customer submitted.
- **`verify_payment(purchase_id, decision, verified_by)`** — row-locks the
  purchase, requires status `verification_requested`, sets
  `verified`/`rejected` + `verified_at` + `verified_by`, and — only on
  `verified` — calls `grant_entitlement()` in the same transaction. Calling
  it again on an already-decided purchase returns the existing row instead
  of erroring or granting twice.

## Storage

Bucket `career-resumes` is **private** (`public = false`), 20 MiB limit,
PDF/DOC/DOCX only. Path convention: `{user_id}/{resume_id}/original.<ext>`.
Storage RLS policies require the path's first folder segment to equal
`auth.uid()` — a user can SELECT/INSERT/DELETE only inside their own folder.
No public URLs are ever generated for a CV file. If a later feature needs
temporary access (e.g. handing a PDF to an AI provider), it must use a
short-lived **signed URL** minted server-side, or process the file entirely
inside an Edge Function — never a permanent public link.

## Auth

Supabase Auth, magic link / email OTP — no passwords for MVP
(`enable_signup = true`, `password_requirements` unset but unused by the
intended UX). For this first technical MVP, authentication happens
**before** upload, because a private-CV bucket needs an owner from the
first byte written. The schema is built so this can loosen later — an
anonymous-session-first funnel (upload → analysis → result → save/unlock →
email identity) would attach an already-existing anonymous `resumes` row to
a freshly-created user rather than requiring a new table shape.

Admin identity for `verify-payment` deliberately does **not** go through
Supabase Auth at all yet — there is no admin-role flag on `profiles`. It's
gated by a shared secret (`ADMIN_API_KEY`) instead. This is a known,
temporary simplification; see "Future PayPal automation seam" below for
where a real admin-role system would slot in.

## Edge Functions

- **`career-health`** — public liveness probe, `{ ok: true, service:
  "career-api" }`. No auth, no DB call, no secret read. Proves the static
  frontend can reach a Supabase Edge Function; not linked in any
  customer-facing UI (see `src/components/CareerHealthProbe.tsx`, dev-only).
- **`request-payment-verification`** — authenticated (real Supabase user
  JWT, checked via `auth.getUser()`), calls
  `request_payment_verification()` with the user id taken from the verified
  session. Never grants anything; only moves a purchase into
  `verification_requested`.
- **`verify-payment`** — gated by `ADMIN_API_KEY` (constant-time header
  compare), not by any Supabase session. Calls `verify_payment()`, which
  is where an entitlement actually gets created. Not linked to any UI —
  the trusted admin tool that calls this doesn't exist yet.
- **Retired (01C): `lemon-webhook`** — removed entirely (see "What changed"
  below). Lemon Squeezy is not the active provider.
- **`delete-resume` / `delete-career-data`** (Command 02) — built; see
  `docs/career-privacy.md`, "Deletion flow".
- Still not built (per the brief): `analyze-resume`, `create-report`,
  `rewrite-resume`, and (not part of this MVP) a `create-purchase` step
  that would insert the initial `pending` row — see "What's still missing"
  below.

`supabase/config.toml` sets `verify_jwt = false` on every function above —
each does its own, different in-function auth check (a real user JWT for
`request-payment-verification`, the `ADMIN_API_KEY` header for
`verify-payment`, nothing for the public `career-health`), so gateway-level
JWT verification is never in the way and each function owns its own 401s.

## Product keys

`supabase/functions/_shared/productKeys.ts` (01C, replacing 01B's
Lemon-specific `productMap.ts`) lists the stable internal `ProductKey`
union — `career_cv_full_review`, `career_cv_rewrite`, etc. — with no
provider-specific mapping in it at all, because PayPal payment links carry
no provider-issued product identifier the way a Lemon Squeezy webhook's
`variant_id` did. A purchase's `product_key` is set once, when the purchase
row is created (not built yet — see below); nothing downstream (request,
verify, grant) re-derives it from anything provider-supplied. As before:
never a button label, checkout URL, displayed price, or query string —
all four are editable in devtools before a click.

## What changed (01C payment correction)

- Deleted `supabase/functions/lemon-webhook/` entirely.
- Deleted `supabase/functions/_shared/productMap.ts` (Lemon variant→product
  mapping); replaced by provider-neutral `productKeys.ts`.
- `purchases.provider` check constraint: `paypal | lemon_squeezy | manual`
  (was `= 'lemon_squeezy'` only). `lemon_squeezy` stays in the *type* so the
  database doesn't need another migration if it's ever reinstated — it is
  not written anywhere by active code today.
- `purchases.status` vocabulary replaced for the manual-verification model.
- `entitlements.source` check constraint: `purchase_verification |
  manual_grant | promo` (was `lemon_squeezy | manual | promo`) — source now
  describes *how* a grant happened (verified purchase vs. hand-comp vs.
  promo), not *which provider*, so a future provider swap never touches
  this constraint again.
- `.env.example`: removed `LEMON_SQUEEZY_WEBHOOK_SECRET`,
  `LEMON_SQUEEZY_API_KEY`; added `ADMIN_API_KEY`.
- `.gitignore`: added `!.env.example` so the template is trackable while
  every real `.env*` file stays ignored (01B's `.env.example` existed on
  disk but was never actually committed — fixed).

## What's still missing (flagged, not built — out of scope for 01B/01C)

- **Purchase creation.** Nothing yet creates the initial `pending` row in
  `purchases` — that's the "Unlock Full Report" click in the future Career
  UI, which is explicitly out of scope here ("Do NOT implement the Career
  UI yet"). When it's built, it should validate `product_key` and
  `expected_amount`/`currency` against `src/config/payments.ts` rather than
  trusting whatever the client sends, the same way `request_payment_verification`
  and `verify_payment` don't trust client-supplied ownership.
- **Admin tool.** `verify-payment` has no caller yet — no dashboard, no
  CLI. Whoever builds it needs `ADMIN_API_KEY` and nothing else from this
  backend.
- **`ADMIN_API_KEY` is a stopgap**, not a role system. It authenticates
  "holds the shared secret," not "is a specific admin user," and it can't
  express "verified_by should be a real identity we can audit against
  `auth.users`." A proper `is_admin` claim/table is worth building before
  more than one person needs to verify payments.

## Future PayPal automation seam (Part 12 — documented only, not built)

The chain today is `PayPal payment link → manual verification (a human
reading a submitted reference) → verify_payment() → grant_entitlement()`.
Automating it later means replacing **only** the middle step:

```
PayPal payment link → PayPal Orders API + server-side capture
                        verification + PayPal webhook (signature-verified,
                        same pattern lemon-webhook used: raw body, HMAC/
                        signature check, idempotent on a unique provider
                        order id)
                     → calls verify_payment() the same way verify-payment
                        does today, or grant_entitlement() directly if the
                        webhook already represents a fully-trusted verified
                        state
```

`grant_entitlement()` does not change. `purchases`'s shape does not change
(`provider = 'paypal'` already fits both the manual and automated case;
`provider_order_id` — currently unused by the manual flow — is exactly
where a PayPal order id would go once one exists). The Career product's
entitlement model — "does this user have `career_cv_full_review`" — never
has to know which of the two paths produced it.

## Privacy / data lifecycle

Every uploaded CV has, from the first row: an owner (`resumes.user_id`), a
storage path, a `created_at`, and a `deleted_at` slot. **Command 02 built
this fully**: `delete-resume` (real Storage object removal, immediate) and
`delete-career-data` (the same, for every resume a user owns) both run
under the service role via `security definer` RPCs that re-check ownership
server-side, so a client can never race a storage delete against an
in-flight analysis. See `docs/career-privacy.md`, "Deletion flow", for the
full picture — including what's still only a soft-delete-plus-audit-row
today (row purge on a schedule is configured, not yet automated).

**Training data boundary (hard rule):** customer CVs are never
automatically added to training data, a knowledge base, examples, or a RAG
corpus. Default is no reuse. Only the operator's own CVs, manually
approved examples, synthetic examples, or explicitly opted-in anonymized
customer examples may enter a reusable Career methodology dataset. As of
Command 02 this is no longer just a documented rule — that dataset lives
in a physically separate Postgres schema (`knowledge`, outside
`api.schemas`) with its own consent model (`user_consents`); see
`docs/career-privacy.md` for the full design.

No vector search, embeddings, RAG or fine-tuning are implemented or
scheduled here — the methodology (rubric + approved examples) comes first.

## Hosted Supabase status

No hosted Supabase project is linked to this repository. Checked directly,
not assumed: no `SUPABASE_ACCESS_TOKEN`, no linked project ref anywhere
under `supabase/`, and `supabase projects list` fails with "Access token
not provided" — the CLI has never been logged in or linked here. Everything
in this document has been verified against the **local** Docker-based
Supabase stack only.

**LOCAL: ready.** **PRODUCTION: not ready — a hosted project does not
exist yet.**

To get production-ready, create a Supabase project (supabase.com) and:

1. `supabase login`, then `supabase link --project-ref <ref>` in this repo.
2. `supabase db push` — applies all three migrations (`20260812000001_career_core.sql`,
   `20260812100001_generic_payment_verification.sql`,
   `20260812200001_career_privacy_foundation.sql`), which also creates the
   `career-resumes` bucket and every RLS policy/grant.
3. `supabase functions deploy career-health request-payment-verification verify-payment delete-resume delete-career-data`.
4. `supabase secrets set ADMIN_API_KEY=<generate a real random secret>`
   (and `AI_PROVIDER_API_KEY` when that work starts — not needed yet).
   `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` are
   injected automatically by the hosted platform; nothing to set for those.
5. Auth: confirm the hosted project's Site URL / redirect URLs cover
   `https://www.turkialmalki.com` (and `https://turkialmalki.com`) for
   magic-link emails to redirect correctly. Confirm SMTP is configured
   (Supabase's default email sending has strict rate limits, unsuitable
   for real signups) or plug in a real provider.
6. Frontend build: add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions repository
   secrets and reference them in [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)'s
   build step, the same way `NEXT_PUBLIC_GTM_ID` already is. Not done in
   this command — nothing to point it at yet.
7. Storage: confirm the hosted project's default file-size and bucket
   limits don't conflict with the 20 MiB cap already declared in the
   migration (they shouldn't, but worth a look at Studio → Storage after
   the push).

None of this can be done by an agent without human-held credentials —
creating the project, generating `ADMIN_API_KEY`, and adding GitHub
secrets all require access this environment doesn't have and shouldn't be
handed.
