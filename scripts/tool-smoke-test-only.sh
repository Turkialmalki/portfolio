#!/usr/bin/env bash
# Command 05D §5 — STRUCTURED TOOL SMOKE TEST only.
# Run this. If (and only if) it succeeds, run weak-entry-fixture-only.sh next.
#
#   export ADMIN_API_KEY=<your value>
#   bash tool-smoke-test-only.sh

set -uo pipefail

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "ERROR: export ADMIN_API_KEY first (do not paste the value in chat)." >&2
  exit 1
fi

URL="https://uepcmdrvaygilmrluiii.supabase.co/functions/v1/analyze-resume"

curl -sS -w '\nHTTP_STATUS:%{http_code}\n' -X POST "$URL" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "smoke_test_tool"}'
