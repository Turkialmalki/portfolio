#!/usr/bin/env bash
# Command 05D §6 — exactly ONE Career fixture: weak_entry_english.
# ONLY run this after tool-smoke-test-only.sh has succeeded. Do not run
# the full fixture suite yet.
#
#   export ADMIN_API_KEY=<your value>
#   bash weak-entry-fixture-only.sh

set -uo pipefail

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "ERROR: export ADMIN_API_KEY first (do not paste the value in chat)." >&2
  exit 1
fi

URL="https://uepcmdrvaygilmrluiii.supabase.co/functions/v1/analyze-resume"

curl -sS -w '\nHTTP_STATUS:%{http_code}\n' -X POST "$URL" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "fixture_test",
    "request": {
      "resumeText": "Noor Fictional\nnoor.fictional@example.com | 555-010-0100\n\nSummary\nHighly motivated results-driven recent graduate seeking a challenging opportunity.\n\nExperience\nIntern - Fictional Retail Co\n2025 - Present\n- Responsible for the management of the customer service desk.\n- Worked on various projects.\n- Helped with inventory.\n\nEducation\nBSc Business Administration, Fictional State University, 2025\n\nSkills\nExcel, PowerPoint, Communication, Teamwork, Leadership, Customer Service, Time Management",
      "language": "en",
      "seniority": "entry"
    }
  }'
