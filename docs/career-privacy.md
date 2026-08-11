# Career privacy, security & trust (Command 02)

Builds on [docs/backend-architecture.md](backend-architecture.md) (Commands
01B/01C). This document covers the privacy/consent/deletion foundation
added in Command 02: what's classified where, what a deletion actually
does, what consent actually means, and what still isn't built.

No AI methodology, scoring, scanner, or `/career` UI exists yet — none of
that was in scope for this command, and none of it is built here either.

## Data classification

| Class | What | Where | Client access |
|---|---|---|---|
| **A — Private customer data** | resumes, parsed text (future), analyses, rewrite drafts (future), job descriptions (future), LinkedIn content (future), account info | `public.resumes`, `public.resume_analyses`, `public.profiles`, storage `career-resumes` | Own rows only, via RLS |
| **B — Payment/account data** | purchase references, verification status, entitlements | `public.purchases`, `public.entitlements` | SELECT own rows only |
| **C — Product knowledge** | rubrics, approved examples, patterns | `knowledge.*` (separate Postgres **schema**) | None — not in `api.schemas`, no RLS policy grants access to anyone but `service_role` |
| **D — Analytics** | anonymous funnel/product events | GTM `dataLayer` only, not a database concern | N/A — see "Analytics privacy" below |

### Why C is a separate schema, not just separate tables

`supabase/config.toml`'s `api.schemas = ["public", "graphql_public"]` means
PostgREST — and therefore every browser call, publishable key or user JWT
alike — can only ever see `public` and `graphql_public`. The
[Command 02 migration](../supabase/migrations/20260812200001_career_privacy_foundation.sql)
creates a `knowledge` schema outside that list, with RLS forced and zero
policies granted to `anon`/`authenticated` on top, and revokes schema
`USAGE` from `PUBLIC`. Getting from A to C would require deliberately
adding `knowledge` to `api.schemas`, or writing new code that opens a
service-role connection and inserts into it — there is no accidental path,
only a load-bearing decision someone would have to make on purpose.

## Data flow

```
USER
  │  uploads CV (authenticated only — see backend-architecture.md, "Auth")
  ▼
PRIVATE CV STORAGE            storage bucket `career-resumes` (private,
  │                            RLS-scoped to {user_id}/... path prefix)
  ▼
SERVER-SIDE PROCESSING        Edge Function (service role) — not built
  │                            yet (analyze-resume), but the boundary is
  │                            fixed: browser never talks to the AI
  │                            provider directly (§13)
  ▼
AI PROVIDER                   receives ONLY what
  │                            supabase/functions/_shared/aiRequestBoundary.ts's
  │                            AIAnalysisRequest type allows — never email,
  │                            phone, purchase data, or internal ids
  ▼
PRIVATE ANALYSIS              `resume_analyses`, RLS-scoped to the owner,
  │                            written only by the (future) Edge Function
  ▼
USER
```

A separate, deliberately disconnected track:

```
TURKI CAREER METHODOLOGY (operator-authored rubrics)
  ▼
APPROVED KNOWLEDGE            knowledge.career_rubrics, knowledge.approved_examples,
  │                            knowledge.before_after_patterns, knowledge.role_patterns
  ▼
ANALYSIS CONTEXT              handed to the AI provider ALONGSIDE the
                               current customer's own resume — never
                               instead of, never derived automatically
                               from, another customer's resume
```

**NO DEFAULT PATH: CUSTOMER CV ✕ KNOWLEDGE/TRAINING.** The only bridge
between the two tracks above is `knowledge.approved_examples.source =
'customer_opt_in'`, which the migration's own CHECK constraints require to
carry a non-null `source_consent_id` (a real, active `user_consents` row)
and `anonymized = true` — a customer example cannot even be inserted into
the table without both being true, let alone reached automatically from an
upload or a payment.

## Consent model

`public.user_consents` — one row per grant/revocation event, append-only.

- **Default: no row.** A user who has never called INSERT here has
  consented to nothing.
- **Active** = a row exists with `revoked_at is null`. `public.has_active_consent(user_id, type)`
  (security-definer, `service_role`-only) is the check any future
  ingestion path must call — and must call again at the moment of
  ingestion, not just at approval time, so a revocation between "approved"
  and "ingested" is honored (§10).
- **Revocation is final** — enforced by a trigger
  (`enforce_consent_append_only`), not just app logic: `revoked_at` may
  move from `null` to a timestamp exactly once; it can never be reset to
  `null` (no client-side "un-revoke") and no other column on an existing
  row can change at all. Re-consenting after a revocation inserts a new
  row, preserving full history.
- **A user can only ever grant/revoke consent for themselves** — RLS's
  `with check (user_id = auth.uid())` on INSERT, matching every other
  ownership check in this schema.
- **What revocation does and does not undo:** it stops any future
  ingestion of not-yet-approved material. It does **not** retroactively
  remove an already-approved, already-anonymized `knowledge.approved_examples`
  row — that row, by the time it exists, no longer identifies the person
  who opted in (that's what "anonymized" means), so there is nothing
  personal left to withdraw from it. This is documented behavior, not
  implemented automatic handling — no ingestion pipeline exists yet to
  produce such a row in the first place.

## Anonymization — design only

`supabase/functions/_shared/anonymize.ts` defines the interface (input:
approved text; output: redacted text + a findings list an operator
reviews) a future ingestion path implements against. **It throws if
called** — deliberately, so nothing can silently wire it up half-built.
No customer content reaches this module in this phase, matching §11.

## AI provider data boundary — design only

`supabase/functions/_shared/aiRequestBoundary.ts`'s `AIAnalysisRequest`
type is the exhaustive list of what a future `analyze-resume` call may
send: parsed CV text, target role, experience level, job description,
rubric id, approved-example ids. Structurally excluded (not just
documented): email, phone, purchase/PayPal data, analytics ids, database
internal metadata. `stripContactFields()` is the fixed signature for a
future preprocessing step; also not implemented yet, since no CV parser
exists. The hard rule from §13 — browser → Edge Function → AI provider,
never browser → AI provider directly — carries over unchanged from
`docs/backend-architecture.md`; nothing in this command changes it.

## Retention model

Centralized in `supabase/functions/_shared/retention.ts` — every period
Career-related code should ever reference lives there, not scattered
inline. **Configured targets, not all implemented yet:**

| Data | Target | Actually enforced today? |
|---|---|---|
| Original CV file | ≤730 days, or until deleted | File removal on delete: **yes, immediate**. Time-based expiry: no job exists |
| Parsed text | ≤730 days | N/A — no parser exists yet |
| Analysis | ≤730 days, or cascades with resume deletion | Cascade on resume deletion: **yes**. Independent expiry: no job exists |
| Temporary processing artifacts | ≤24 hours | N/A — nothing generates these yet |
| Soft-deleted row purge | ≤30 days after `deleted_at` | Soft-delete itself: **yes, immediate**. Purge job: not built |
| Payment/account records | Indefinite | Yes — by design, see below |

This table is why `/career/privacy` does not promise a specific number of
hours or days for permanent backend removal — see that page's "Retention"
section, which is intentionally narrower than this internal table.

## Deletion flow

Two Edge Functions, both idempotent, both re-checking ownership inside a
`security definer` Postgres function against the caller's own verified
session id (never the request body) — the same double-check pattern
`request_payment_verification` established in 01C.

- **`delete-resume`** ([supabase/functions/delete-resume/index.ts](../supabase/functions/delete-resume/index.ts)) —
  calls `delete_resume(resume_id, user_id)`. Removes the Storage object
  immediately (real byte removal). Soft-deletes the `resumes` row and its
  `resume_analyses` rows (`deleted_at`). Writes a `deletion_audit` row.
  Repeat calls return `{ ok: true, already_deleted: true }` instead of
  erroring, and safely retry the Storage removal.
- **`delete-career-data`** ([supabase/functions/delete-career-data/index.ts](../supabase/functions/delete-career-data/index.ts)) —
  the foundation for "Delete my Career data": calls `delete_career_data(user_id)`,
  which soft-deletes every resume + analysis the user owns and audits it.
  Rewrite drafts, LinkedIn data, and profile deletion are named as future
  scope in the brief; there is no code for any of them yet, so this
  function has nothing more to touch today — extending it later means
  extending `delete_career_data()` in the migration, not this function's
  shape.

### Career content vs. financial records

Neither function touches `purchases` or `entitlements`. This is
deliberate, not an oversight: refund/dispute handling, accounting, and
fraud prevention are the same operational reasons any paid product keeps
its financial ledger after a customer deletes other account data. A
request to handle financial records differently needs a distinct,
human-reviewed process — not a self-service delete button — and is out of
scope here.

### Anti-enumeration

`delete_resume()` raises the exact same error (`resume_not_found`) whether
a resume id doesn't exist at all or belongs to another user — a caller
learns nothing about whether an id they don't own exists. This is what the
Edge Function maps to a flat `404 NOT_FOUND`, never a `403`.

## Safe logging

`supabase/functions/_shared/safeLog.ts`'s `SafeLogFields` type is an
allowlist, not a redaction filter: `event`, `request_id`, `resume_id`,
`analysis_id`, `purchase_id`, `user_id`, `error_code`, `duration_ms`,
`status`. There is no field on the type a caller could use to pass a CV
body, a full AI prompt, or an AI response through — the type itself is the
enforcement. Both new Edge Functions in this command use only this helper
for logging.

## Error handling

`supabase/functions/_shared/errorCodes.ts` defines the public vocabulary:
`INVALID_FILE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE`, `UPLOAD_FAILED`,
`ANALYSIS_FAILED`, `NOT_AUTHORIZED`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`,
`INVALID_REQUEST`, `INTERNAL_ERROR` — each with a fixed status code and a
short static message. `classifyRpcError()` maps this command's own RPC
exception messages (`resume_not_found`) to a safe code; anything
unrecognized collapses to `INTERNAL_ERROR` rather than being forwarded, so
a raw Postgres/driver error string can never leak through by surprise.

## Analytics privacy

`src/lib/careerAnalytics.ts`'s `trackCareerEvent()` wraps the site-wide
`trackEvent` with two independent guards: an event-name allowlist (only
the seven names from §16 — `career_viewed`, `cv_upload_started`,
`cv_upload_completed`, `analysis_started`, `analysis_completed`,
`free_report_viewed`, `unlock_clicked` — are ever forwarded) and a
payload-key blocklist that strips anything matching resume/CV/job-
description/AI-output/PayPal/email/phone/name patterns. The key match
normalizes casing first (`jobDescriptionText` → `job_description_text`)
so camelCase fields can't slip past a snake_case-only pattern — an actual
gap caught by running the sanitizer logic directly during this command
(see `supabase/tests/README.md`, test I) and fixed before landing. Nothing
calls `trackCareerEvent` yet; no Career UI exists.

## Clarity / session recording

The site loads Microsoft Clarity through GTM (`src/components/Analytics.tsx`).
Command 02 requires sensitive Career surfaces to never be captured in
session recordings, and default Clarity behavior is not assumed sufficient
on its own. Implemented, ahead of any Career UI existing:

1. **Route exclusion, checked before the script ever loads.**
   `src/config/careerPrivacySurfaces.ts` lists path prefixes
   (`/career/upload`, `/career/scan`, `/career/report`, `/career/editor`,
   `/career/account` — none exist yet) that must never be recorded.
   `/career/privacy` is deliberately **not** on this list — it's static
   policy text, nothing sensitive to protect.
2. **Reactive to client-side navigation.** This is a client-routed app —
   a script tag injected once doesn't re-run on every route change — so
   `Analytics.tsx` re-evaluates on every `usePathname()` change: if
   Clarity hasn't loaded yet and the current route is excluded, it's never
   injected; if Clarity is already running and the visitor navigates into
   an excluded route, `window.clarity("stop")` pauses recording, and
   `window.clarity("start")` resumes it on leaving. This is Clarity's own
   documented pause/resume API.
3. **Defense in depth for mixed pages.** `src/components/ClarityMask.tsx`
   wraps content in `data-clarity-mask="true"`, Clarity's own attribute
   for redacting a subtree's text/images in recordings even on a
   non-excluded route. Not used anywhere yet.

What this does **not** guarantee: a few frames between a route change
firing and the `useEffect` running, and — if the visitor's very first page
load is a non-excluded page — whatever normal recording already covers
that unrelated page. Both are inherent to any client-side, JS-driven
approach; a route that must **never** record even during that window
should stay off Clarity's script-load path entirely, which is exactly
what case 1 above does for a cold load on an excluded route.

## Privacy page

`/career/privacy` ([src/app/career/privacy/](../src/app/career/privacy/)),
bilingual (Arabic default, English via the site's existing
`useLanguage()`/`LanguageProvider`), sections: Your CV is private · What
information we process · Why we process it · How AI is used · What we do
NOT do · Storage · Retention · Training & knowledge reuse · Payments ·
Deletion · Your choices · Contact. Arabic is authored directly, not
machine-translated. The "Deletion" and "Retention" sections match this
document's honesty constraint: no specific-hours promise, and an explicit
note that the self-serve delete button is "coming next" rather than
already live, since the backend (`delete-resume`) exists but no `/career`
UI does yet.

## Reusable trust copy

`src/config/careerTrustCopy.ts` — `CAREER_UPLOAD_MICROCOPY` (bilingual
upload-screen microcopy + link to `/career/privacy`) and
`CAREER_AI_TRUST_EXPLANATION` (the "AI-powered analysis built around
Turki's career review methodology" line, in both languages). Not imported
by any component yet — no upload UI exists.

## Security test results

**Not executed in this environment.** The sandbox this command ran in has
no Docker or Podman (`npx supabase status` fails with
`docker: command not found`), no local `psql`/Postgres, and no `deno` —
so `supabase start`, the SQL test suite, and a served-functions HTTP test
were all unavailable here. See [supabase/tests/README.md](../supabase/tests/README.md)
for exact run instructions once Docker is available.

What **was** verified in this environment:

| Test | Result |
|---|---|
| A–H, consent bonus (RLS + RPC, SQL) | **Not run** — written, not executed (`supabase/tests/career_privacy_security.sql`) |
| D–F end-to-end via HTTP | **Not run** — needs served functions |
| I — analytics helper rejects sensitive fields | **PASS** — sanitizer logic run directly with Node; caught and fixed a real camelCase-matching gap first |
| J — no privileged secrets in static build | **PASS** — `npm run build` + `grep -rIl "SERVICE_ROLE\|ADMIN_API_KEY\|AI_PROVIDER_API_KEY" out/` → no matches |
| K — logs contain no raw CV content | **Not run** — no served functions to observe; verified by code review only (both new functions log exclusively through `safeLog`'s allowlisted type) |
| TypeScript / Next.js build | **PASS** — `npx tsc --noEmit` clean, `npm run build` produces `/career/privacy` as a static page alongside every existing route |

## LOCAL READY

**Code: yes.** Migration, Edge Functions, RLS policies, and frontend all
type-check and build cleanly, and follow the same patterns already
verified against a running local instance in 01B/01C.

**Verified-by-execution: no.** Tests A–H, D–F (HTTP), and K require a
running local Supabase stack this sandbox could not start. Run
`supabase/tests/career_privacy_security.sql` and the HTTP checks in
`supabase/tests/README.md` before treating this command's RLS/deletion
guarantees as confirmed rather than reviewed.

## PRODUCTION READY

**No** — unchanged from 01B/01C. No hosted Supabase project exists; see
`docs/backend-architecture.md`, "Hosted Supabase status", for the full
production checklist. This command adds two more items to it whenever
that work starts: deploy `delete-resume` and `delete-career-data`
alongside the existing three functions, and decide/implement the actual
purge job for `deletedRowPurgeDays` before the retention table above can
say "enforced" instead of "configured."
