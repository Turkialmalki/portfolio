#!/usr/bin/env bash
# Command 05D §4 — run ONLY the basic Anthropic smoke test. Do not run the
# full fixture suite or the tool smoke test until this passes.
#
#   export ADMIN_API_KEY=<your value>
#   bash smoke-test-basic-only.sh

set -uo pipefail

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "ERROR: export ADMIN_API_KEY first (do not paste the value in chat)." >&2
  exit 1
fi

URL="https://uepcmdrvaygilmrluiii.supabase.co/functions/v1/analyze-resume"

curl -sS -w '\nHTTP_STATUS:%{http_code}\n' -X POST "$URL" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "smoke_test_basic"}'
