#!/usr/bin/env bash
#
# REAL-PROVIDER SYNTHETIC SMOKE TEST — Career V2 contract-drift fix
# verification (strict tool-use schema, commit 366836a).
#
# ONE call to the REAL Anthropic provider through analyze-resume's
# existing admin-gated `mode: "fixture_test"` path (contract verified
# directly from supabase/functions/analyze-resume/index.ts — nothing
# here guesses the request shape). Uses ONLY a fully-synthetic, fictional
# fixture ("Noor Fictional") — never real customer data.
#
# ADMIN_API_KEY is read from the environment only. This script never
# echoes it, never logs it, and never writes it to disk. Set it securely
# (keeps it out of shell history) with:
#
#   read -s ADMIN_API_KEY
#   export ADMIN_API_KEY
#   bash scripts/real-provider-smoke-test.sh
#
# Prints ONLY: HTTP_STATUS, SUCCESS, STOP_REASON, SCHEMA_ISSUE_COUNT,
# DIMENSION_COUNT, PROVIDER_ATTEMPTS, SCHEMA_REPAIR_COUNT,
# PROVIDER_DURATION_MS, TOTAL_DURATION_MS, PASS. Never prints: the CV
# text, the prompt, any AI-generated prose (reasonCode/shortReason/
# evidence), the API key, or the Authorization/x-admin-key header.
#
# `schema_issue_count` is deliberately NOT among the fields
# analyze-resume ever returns to ANY caller, admin included (see
# safeLog.ts's schema_issue_sample / analyze-resume/index.ts's catch
# block) — it only ever reaches the server-side safe log, on purpose, so
# this script reports it as "0" on success (the pipeline only returns
# ok:true after validateDimensionAIResults succeeds with zero issues) or
# "server_log_only" on failure, rather than fabricating a number it was
# never given.

set -uo pipefail

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "ERROR: ADMIN_API_KEY is not set. Run:" >&2
  echo "  read -s ADMIN_API_KEY && export ADMIN_API_KEY" >&2
  exit 1
fi

BASE="https://uepcmdrvaygilmrluiii.supabase.co/functions/v1"

BODY='{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Noor Fictional\nnoor.fictional@example.com | 555-010-0100\n\nSummary\nHighly motivated results-driven recent graduate seeking a challenging opportunity.\n\nExperience\nIntern - Fictional Retail Co\n2025 - Present\n- Responsible for the management of the customer service desk.\n- Worked on various projects.\n- Helped with inventory.\n\nEducation\nBSc Business Administration, Fictional State University, 2025\n\nSkills\nExcel, PowerPoint, Communication, Teamwork, Leadership, Customer Service, Time Management",
    "language": "en",
    "seniority": "entry"
  }
}'

TMP_BODY=$(mktemp)
TMP_SUMMARY=$(mktemp)
trap 'rm -f "$TMP_BODY" "$TMP_SUMMARY"' EXIT

# Single real-provider call. %{http_code}/%{time_total} are curl's own
# transport metadata, not response content.
READ=$(curl -sS -o "$TMP_BODY" -w '%{http_code} %{time_total}' -X POST "$BASE/analyze-resume" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY")
HTTP_STATUS=$(echo "$READ" | awk '{print $1}')
TOTAL_DURATION_MS=$(echo "$READ" | awk '{printf "%d", $2 * 1000}')

# Extracts ONLY the allowlisted, non-content fields — never dumps the
# response body, never touches dimensions[].reason/evidence/reasonCode.
node -e '
  const fs = require("fs");
  let json = null;
  try { json = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); } catch { /* leave null */ }
  const ok = !!(json && json.ok === true);
  const inst = json && json.instrumentation;
  const dims = json && json.analysis && Array.isArray(json.analysis.dimensions) ? json.analysis.dimensions.length : "";
  const out = {
    OK: ok,
    STOP_REASON: inst && inst.stopReason ? inst.stopReason : "",
    DIMENSION_COUNT: dims,
    PROVIDER_ATTEMPTS: inst ? inst.aiCallCount : "",
    SCHEMA_REPAIR_COUNT: inst ? inst.retryCount : "",
    PROVIDER_DURATION_MS: inst ? inst.durationMs : "",
  };
  for (const [k, v] of Object.entries(out)) process.stdout.write(`${k}=${v}\n`);
' "$TMP_BODY" > "$TMP_SUMMARY"

# shellcheck disable=SC1090
source "$TMP_SUMMARY"

SUCCESS="false"
[ "${OK:-}" = "true" ] && SUCCESS="true"

if [ "$SUCCESS" = "true" ]; then
  SCHEMA_ISSUE_COUNT="0"
else
  SCHEMA_ISSUE_COUNT="server_log_only"
fi

PASS="false"
if [ "$SUCCESS" = "true" ] && [ "${STOP_REASON:-}" = "tool_use" ] && [ "${DIMENSION_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  PASS="true"
fi

echo "HTTP_STATUS: $HTTP_STATUS"
echo "SUCCESS: $SUCCESS"
echo "STOP_REASON: ${STOP_REASON:-n/a}"
echo "SCHEMA_ISSUE_COUNT: $SCHEMA_ISSUE_COUNT"
echo "DIMENSION_COUNT: ${DIMENSION_COUNT:-n/a}"
echo "PROVIDER_ATTEMPTS: ${PROVIDER_ATTEMPTS:-n/a}"
echo "SCHEMA_REPAIR_COUNT: ${SCHEMA_REPAIR_COUNT:-n/a}"
echo "PROVIDER_DURATION_MS: ${PROVIDER_DURATION_MS:-n/a}"
echo "TOTAL_DURATION_MS: $TOTAL_DURATION_MS"
echo "PASS: $PASS"

[ "$PASS" = "true" ]
