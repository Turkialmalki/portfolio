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
# PROVIDER_DURATION_MS, TOTAL_DURATION_MS, PASS, and — ONLY on a non-2xx
# response — the same safe diagnostic fields analyze-resume's fixture/
# admin path already deliberately returns for exactly this purpose
# (Command 05D §1, anthropicClient.ts's AnthropicCallDiagnostics /
# buildProviderDiagnosticBody, an explicit closed allowlist: HTTP status,
# a fixed Anthropic error-TYPE string like "overloaded_error", a request
# id, and its own already-sanitized short message — never a prompt, CV
# text, or model-generated prose): ERROR_CODE, MESSAGE, DIAGNOSTIC_CODE,
# PROVIDER_HTTP_STATUS, PROVIDER_ERROR_TYPE, PROVIDER_ERROR_MESSAGE,
# STAGE. Never prints: the CV text, the prompt, any AI-generated prose
# (reasonCode/shortReason/evidence/dimension content), the API key, or
# the Authorization/x-admin-key header.
#
# `schema_issue_count` is deliberately NOT among the fields
# analyze-resume ever returns to ANY caller, admin included (see
# safeLog.ts's schema_issue_sample / analyze-resume/index.ts's catch
# block) — it only ever reaches the server-side safe log, on purpose, so
# this script reports it as "0" on success (the pipeline only returns
# ok:true after validateDimensionAIResults succeeds with zero issues) or
# "server_log_only" on failure, rather than fabricating a number it was
# never given.
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
  const dimensionCount = json && json.analysis && Array.isArray(json.analysis.dimensions) ? json.analysis.dimensions.length : null;
  const stopReason = inst && inst.stopReason ? clip(inst.stopReason) : null;
  const providerAttempts = inst ? inst.aiCallCount : null;
  const schemaRepairCount = inst ? inst.retryCount : null;
  const providerDurationMs = inst ? inst.durationMs : null;
  const schemaIssueCount = ok ? 0 : "server_log_only";

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

  // Only present on a non-2xx response — buildProviderDiagnosticBody
  // (a raw AnthropicProviderError: auth/billing/rate-limit/5xx from
  // Anthropic itself) has `diagnosticCode`; errorCodes.ts`s safeError()
  // (our own pipeline/validation failure, e.g. ANALYSIS_FAILED/
  // ANALYSIS_TIMEOUT) never does — that key`s presence is exactly how to
  // tell the two failure shapes apart.
  if (!ok && json) {
    line("ERROR_CODE", json.error ? clip(json.error) : null);
    line("MESSAGE", json.message ? clip(json.message) : null);
    line("DIAGNOSTIC_CODE", json.diagnosticCode ? clip(json.diagnosticCode) : null);
    line("PROVIDER_HTTP_STATUS", json.providerHttpStatus ?? null);
    line("PROVIDER_ERROR_TYPE", json.providerErrorType ? clip(json.providerErrorType) : null);
    line("PROVIDER_ERROR_MESSAGE", json.providerErrorMessageSanitized ? clip(json.providerErrorMessageSanitized) : null);
    line("STAGE", json.stage ? clip(json.stage) : null);
  }

  line("PASS", pass);
  process.exit(pass ? 0 : 1);
' "$TMP_BODY" "$HTTP_STATUS" "$TOTAL_DURATION_MS"
