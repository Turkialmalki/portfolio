# Career privacy & security tests — how to run them

**Environment note:** this test suite was written and reviewed in a
sandbox that has neither Docker/Podman (so `supabase start` cannot bring up
the local stack) nor a local `psql`/Postgres install nor `deno`. It has
**not** been executed against a running database. Everything below is what
to run once you have Docker (or Podman) available locally — see "Local
Ready" status in `docs/career-privacy.md` for what that means for this
command's sign-off.

## A–H, and the consent bonus test (RLS + RPC-level, SQL)

```bash
npx supabase start
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
     -v ON_ERROR_STOP=1 -f supabase/tests/career_privacy_security.sql
```

A clean run prints one `NOTICE: PASS: ...` line per test and nothing else;
`ON_ERROR_STOP=1` means any `FAIL ...` exception aborts the script non-zero.
Everything runs inside a transaction that's rolled back at the end — no
fixture rows are left behind.

## D–F, end-to-end through the real Edge Function (not just the RPC)

The SQL suite exercises `delete_resume()` directly at the Postgres level.
To confirm the whole HTTP path (auth header → `auth.getUser()` →
RPC → Storage removal) once functions are served locally:

```bash
npx supabase functions serve delete-resume

# Sign in as the Alpha fixture via the local GoTrue REST API first to get
# a real access_token, then:
curl -i -X POST http://127.0.0.1:54321/functions/v1/delete-resume \
  -H "Authorization: Bearer <alpha_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"resume_id": "<a resume id NOT owned by alpha>"}'
# Expect: 404 { "error": "NOT_FOUND", ... }  — not 403, not a stack trace.

curl -i -X POST http://127.0.0.1:54321/functions/v1/delete-resume \
  -H "Authorization: Bearer <alpha_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"resume_id": "<a resume id alpha DOES own>"}'
# Expect: 200 { "ok": true, "already_deleted": false }
# Call again with the same body: expect 200, "already_deleted": true.
```

## I. analytics helper rejects sensitive fields

Pure TypeScript, no Deno/Postgres needed — `src/lib/careerAnalytics.ts`'s
`sanitizeParams` logic was reproduced and run directly with plain Node
during this command (camelCase, snake_case, and mixed-case sensitive keys
all verified stripped; a first pass missed camelCase keys like
`jobDescriptionText` against a snake_case-only pattern — fixed by
normalizing the key before matching). To re-run the equivalent check with
the project's real toolchain once a TS runner (`tsx`/`ts-node`) is added as
a dev dependency:

```bash
npx tsx -e '
import { trackCareerEvent } from "./src/lib/careerAnalytics";
// call with a payload containing resumeText/email/phone/paypal_reference
// and confirm (via a dataLayer stub) that none of it reaches trackEvent.
'
```

## J. no privileged secrets in the static build

Already run and passing during this command:

```bash
npm run build
grep -rIl "SERVICE_ROLE\|ADMIN_API_KEY\|AI_PROVIDER_API_KEY" out/   # no matches
```

## K. production-style logs contain no raw CV content

Manual/CI review step once functions are actually invoked against real
traffic (local or hosted): tail `supabase functions serve` output (local)
or `supabase functions logs <name>` (hosted) while exercising
`delete-resume`/`delete-career-data`, and confirm every line matches the
`SafeLogFields` shape from `supabase/functions/_shared/safeLog.ts` — no
resume body, no full AI prompt/output, no phone/email. Both functions in
this command only ever call `safeLog`/`safeLogError` with that allowlisted
shape, so this is a code-review-verifiable claim; it has not yet been
observed against real emitted log lines because the functions have not
been served in this environment.
