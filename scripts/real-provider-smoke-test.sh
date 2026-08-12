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
# Prints: HTTP_STATUS, SUCCESS, STOP_REASON, SCHEMA_ISSUE_COUNT,
# DIMENSION_COUNT, PROVIDER_ATTEMPTS, SCHEMA_REPAIR_COUNT,
# PROVIDER_DURATION_MS, TOTAL_DURATION_MS, PASS — plus, on a non-2xx
# response, the safe diagnostic fields analyze-resume's fixture/admin
# path deliberately returns for exactly this purpose. Two distinct
# failure shapes exist there, both a closed field allowlist, never a
# prompt/CV text/AI prose:
#   - AnthropicProviderError (buildProviderDiagnosticBody, a raw
#     Anthropic HTTP failure): ERROR_CODE, MESSAGE, DIAGNOSTIC_CODE,
#     PROVIDER_HTTP_STATUS, PROVIDER_ERROR_TYPE, PROVIDER_ERROR_MESSAGE,
#     STAGE.
#   - AnalysisPipelineError (buildPipelineErrorDiagnosticBody, OUR OWN
#     pipeline/schema/language/timeout logic): ERROR_CODE, MESSAGE,
#     STAGE, STOP_REASON, SCHEMA_ISSUE_COUNT, PROVIDER_ATTEMPTS,
#     SCHEMA_REPAIR_COUNT, OVERALL_BUDGET_MS, ELAPSED_MS,
#     REMAINING_BUDGET_MS — plus, only for a dimension-validation failure,
#     EXPECTED_DIMENSION_COUNT, RETURNED_RESULT_COUNT,
#     RETURNED_UNIQUE_DIMENSION_COUNT, MISSING_DIMENSION_COUNT,
#     MISSING_DIMENSION_IDS, DUPLICATE_DIMENSION_COUNT,
#     DUPLICATE_DIMENSION_IDS, UNKNOWN_DIMENSION_COUNT,
#     UNKNOWN_DIMENSION_IDS (dimension ids are fixed methodology
#     identifiers, not customer data — safe to print in full). This is
#     the shape a schema-validation or language-gate failure returns —
#     `diagnosticCode` is absent, which is exactly how the two shapes are
#     told apart below.
# Never prints: the CV text, the prompt, any AI-generated prose
# (reasonCode/shortReason/evidence/dimension content), the API key, or
# the Authorization/x-admin-key header.
#
# SECURITY NOTE: everything derived from the HTTP response (provider
# error text included) is parsed and formatted ENTIRELY inside the node
# subprocess below and only ever reaches this shell as this script's own
# fixed-format stdout — never as a shell variable assignment/`source`/
# `eval`. Untrusted response text can therefore never be interpreted as a
# shell command, no matter what characters (`$()`, backticks, etc.) it
# contains.

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
trap 'rm -f "$TMP_BODY"' EXIT

# Single real-provider call. %{http_code}/%{time_total} are curl's own
# transport metadata, not response content — safe to pass straight
# through as plain numbers.
READ=$(curl -sS -o "$TMP_BODY" -w '%{http_code} %{time_total}' -X POST "$BASE/analyze-resume" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY")
HTTP_STATUS=$(echo "$READ" | awk '{print $1}')
TOTAL_DURATION_MS=$(echo "$READ" | awk '{printf "%d", $2 * 1000}')

# Everything below reads the response, decides PASS/FAIL, and prints the
# final report — all inside this one process. Nothing derived from the
# response body is ever handed back to the shell as code or a variable.
node -e '
  const fs = require("fs");
  const httpStatus = process.argv[2];
  const totalDurationMs = process.argv[3];
  const clip = (v) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").slice(0, 200) : v);
  const line = (label, value) => console.log(`${label}: ${value === "" || value == null ? "n/a" : value}`);

  let json = null;
  try { json = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); } catch { /* leave null */ }

  const ok = !!(json && json.ok === true);
  const inst = json && json.instrumentation;
  // buildProviderDiagnosticBody always sets `diagnosticCode`;
  // buildPipelineErrorDiagnosticBody never does — presence of that key
  // is exactly how the two failure envelopes are told apart.
  const isProviderError = !ok && json && json.diagnosticCode != null;
  const isPipelineError = !ok && json && !isProviderError && json.error != null;

  const dimensionCount = json && json.analysis && Array.isArray(json.analysis.dimensions) ? json.analysis.dimensions.length : null;
  // Each core field has exactly ONE source depending on which of the
  // three shapes the response is (success / provider error / pipeline
  // error) — never printed twice with two different values.
  const stopReason = ok ? (inst && inst.stopReason ? clip(inst.stopReason) : null) : isPipelineError ? (json.stopReason != null ? clip(String(json.stopReason)) : null) : null;
  const providerAttempts = ok ? (inst ? inst.aiCallCount : null) : isPipelineError ? json.providerAttempts ?? null : null;
  const schemaRepairCount = ok ? (inst ? inst.retryCount : null) : isPipelineError ? json.schemaRepairCount ?? null : null;
  const providerDurationMs = ok ? (inst ? inst.durationMs : null) : null;
  const schemaIssueCount = ok ? 0 : isPipelineError ? json.schemaIssueCount ?? "server_log_only" : "server_log_only";

  const pass = ok && stopReason === "tool_use" && Number(dimensionCount) > 0;

  line("HTTP_STATUS", httpStatus);
  line("SUCCESS", ok);
  line("STOP_REASON", stopReason);
  line("SCHEMA_ISSUE_COUNT", schemaIssueCount);
  line("DIMENSION_COUNT", dimensionCount);
  line("PROVIDER_ATTEMPTS", providerAttempts);
  line("SCHEMA_REPAIR_COUNT", schemaRepairCount);
  line("PROVIDER_DURATION_MS", providerDurationMs);
  line("TOTAL_DURATION_MS", totalDurationMs);

  if (!ok && json) {
    line("ERROR_CODE", json.error ? clip(json.error) : null);
    line("MESSAGE", json.message ? clip(json.message) : null);
    line("STAGE", json.stage ? clip(json.stage) : null);
    if (isProviderError) {
      // Raw Anthropic HTTP failure (auth/billing/rate-limit/5xx).
      line("DIAGNOSTIC_CODE", clip(json.diagnosticCode));
      line("PROVIDER_HTTP_STATUS", json.providerHttpStatus ?? null);
      line("PROVIDER_ERROR_TYPE", json.providerErrorType ? clip(json.providerErrorType) : null);
      line("PROVIDER_ERROR_MESSAGE", json.providerErrorMessageSanitized ? clip(json.providerErrorMessageSanitized) : null);
    } else if (isPipelineError) {
      // Our own pipeline/schema/language/timeout failure.
      line("OVERALL_BUDGET_MS", json.overallBudgetMs ?? null);
      line("ELAPSED_MS", json.elapsedMs ?? null);
      line("REMAINING_BUDGET_MS", json.remainingBudgetMs ?? null);
      const s = json.dimensionSummary;
      if (s) {
        line("EXPECTED_DIMENSION_COUNT", s.expectedDimensionCount ?? null);
        line("RETURNED_RESULT_COUNT", s.returnedResultCount ?? null);
        line("RETURNED_UNIQUE_DIMENSION_COUNT", s.returnedUniqueDimensionCount ?? null);
        line("MISSING_DIMENSION_COUNT", s.missingDimensionCount ?? null);
        line("MISSING_DIMENSION_IDS", Array.isArray(s.missingDimensionIds) ? s.missingDimensionIds.map(clip).join(",") : null);
        line("DUPLICATE_DIMENSION_COUNT", s.duplicateDimensionCount ?? null);
        line("DUPLICATE_DIMENSION_IDS", Array.isArray(s.duplicateDimensionIds) ? s.duplicateDimensionIds.map(clip).join(",") : null);
        line("UNKNOWN_DIMENSION_COUNT", s.unknownDimensionCount ?? null);
        line("UNKNOWN_DIMENSION_IDS", Array.isArray(s.unknownDimensionIds) ? s.unknownDimensionIds.map(clip).join(",") : null);
      }
    }
  }

  line("PASS", pass);
  process.exit(pass ? 0 : 1);
' "$TMP_BODY" "$HTTP_STATUS" "$TOTAL_DURATION_MS"
