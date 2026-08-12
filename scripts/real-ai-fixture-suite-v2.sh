#!/usr/bin/env bash

now_ms() {
  python3 -c 'import time; print(int(time.time() * 1000))'
}

# Command 05D — REAL AI synthetic fixture suite, v2 (diagnostic).
#
# The v1 run produced an empty results file (every curl call returned
# nothing) — this version prints curl's HTTP status and any transport
# error for each call so we can see WHY, instead of failing silently.
#
#   export ADMIN_API_KEY=<your value>
#   bash real-ai-fixture-suite-v2.sh | tee real-ai-results-v2.json
#
# First, a single sanity call against career-health (no admin key needed)
# to confirm basic network reachability before the real fixture calls.

set -uo pipefail   # NOTE: no -e this time — one failed fixture must not silently drop the rest

if [ -z "${ADMIN_API_KEY:-}" ]; then
  echo "ERROR: export ADMIN_API_KEY first (do not paste the value in chat)." >&2
  exit 1
fi

BASE="https://uepcmdrvaygilmrluiii.supabase.co/functions/v1"

echo "=== sanity check: career-health (no auth) ===" >&2
curl -sS -w '\nHTTP_STATUS:%{http_code}\n' "$BASE/career-health" >&2
echo "=== end sanity check ===" >&2
echo "" >&2

post() {
  local name="$1"
  local body="$2"
  local start end ms http_status resp_body tmpfile

  tmpfile=$(mktemp)
  start=$(now_ms)

  http_status=$(curl -sS -o "$tmpfile" -w '%{http_code}' -X POST "$BASE/analyze-resume" \
    -H "x-admin-key: $ADMIN_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$body" 2>"${tmpfile}.err")
  local curl_exit=$?

  end=$(now_ms)
  ms=$((end - start))
  resp_body=$(cat "$tmpfile" 2>/dev/null)
  local curl_err
  curl_err=$(cat "${tmpfile}.err" 2>/dev/null)
  rm -f "$tmpfile" "${tmpfile}.err"

  # Diagnostics go to stderr (visible to you, not captured in the JSON file).
  echo "[$name] curl_exit=$curl_exit http_status=$http_status wall_clock_ms=$ms body_bytes=${#resp_body}" >&2
  if [ -n "$curl_err" ]; then
    echo "[$name] curl_stderr: $curl_err" >&2
  fi

  if [ -z "$resp_body" ]; then
    echo "{\"fixture\":\"$name\",\"curl_exit\":$curl_exit,\"http_status\":\"$http_status\",\"wall_clock_ms\":$ms,\"response\":null,\"note\":\"EMPTY_BODY\"}"
  else
    echo "{\"fixture\":\"$name\",\"curl_exit\":$curl_exit,\"http_status\":\"$http_status\",\"wall_clock_ms\":$ms,\"response\":$resp_body}"
  fi
}

echo "["

post "weak_entry_english" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Noor Fictional\nnoor.fictional@example.com | 555-010-0100\n\nSummary\nHighly motivated results-driven recent graduate seeking a challenging opportunity.\n\nExperience\nIntern - Fictional Retail Co\n2025 - Present\n- Responsible for the management of the customer service desk.\n- Worked on various projects.\n- Helped with inventory.\n\nEducation\nBSc Business Administration, Fictional State University, 2025\n\nSkills\nExcel, PowerPoint, Communication, Teamwork, Leadership, Customer Service, Time Management",
    "language": "en",
    "seniority": "entry"
  }
}'
echo ","

post "strong_senior_english" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Sami Testcase\nSummary\nSenior backend engineer specializing in distributed payment systems, with a track record of owning reliability end-to-end.\n\nExperience\nSenior Backend Engineer - Fictional Payments Inc\n2022 - Present\n- Led the redesign of the settlement pipeline, reducing failed transactions by 18% across three markets.\n- Owned on-call rotation for the core ledger service, mentoring two engineers into the rotation.\n- Architected a rate-limiting layer that eliminated the recurring outage class from the prior quarter.\n\nBackend Engineer - Fictional Systems Ltd\n2019 - 2022\n- Built the initial event-sourcing pipeline used by four downstream teams.\n- Reduced deployment time from 40 minutes to 6 minutes by automating the release pipeline.\n\nEducation\nBSc Computer Science, Fictional Institute of Technology, 2019\n\nSkills\nGo, Kubernetes, PostgreSQL, distributed systems, on-call ownership, mentoring",
    "language": "en",
    "seniority": "senior",
    "targetRole": "Senior Backend Engineer",
    "jobDescription": "Distributed systems, on-call ownership, mentoring."
  }
}'
echo ","

post "manager_tasks_only" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Reem Placeholder\nSummary\nEngineering manager.\n\nExperience\nEngineering Manager - Fictional Software Co\n2021 - Present\n- Attended sprint planning meetings.\n- Reviewed pull requests.\n- Updated the project tracker weekly.\n- Wrote status reports for stakeholders.\n\nEducation\nBSc Software Engineering, Fictional University, 2015\n\nSkills\nJira, Confluence, Scrum",
    "language": "en",
    "seniority": "manager"
  }
}'
echo ","

post "conflicting_metrics" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Lina Conflictcase\nSummary\nOperations lead with a record of process improvement.\n\nExperience\nOperations Lead - Fictional Logistics Co\n2021 - Present\n- Increased the on-time delivery rate by 20% in Q1.\n- A later summary of the same initiative reported the on-time delivery rate by 35%.\n\nEducation\nBSc Logistics, Fictional University, 2018\n\nSkills\nprocess improvement, logistics, vendor management",
    "language": "en",
    "seniority": "mid"
  }
}'
echo ","

post "polished_no_evidence" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "Lina Mockdata\nSummary\nDynamic, passionate, results-driven executive with a proven track record of transformative success across industries.\n\nExperience\nHead of Strategy - Fictional Holdings Group\n2020 - Present\n- Drove synergy across the organization.\n- Delivered results-driven initiatives that transformed the business.\n- Championed a dynamic culture of excellence.\n\nEducation\nMBA, Fictional Business School, 2015\n\nSkills\nleadership, strategy, synergy, excellence",
    "language": "en",
    "seniority": "senior"
  }
}'
echo ","

post "arabic_generic" '{
  "mode": "fixture_test",
  "request": {
    "resumeText": "مثال افتراضي\nالملخص المهني\nموظف يسعى إلى تحقيق النجاح والتميز في مكان العمل.\n\nالخبرة العملية\nموظف مبيعات - شركة افتراضية\n2020 - الآن\n- المسؤول عن متابعة العملاء.\n- العمل على مهام متنوعة حسب الحاجة.\n\nالتعليم\nبكالوريوس إدارة أعمال، جامعة افتراضية، 2019\n\nالمهارات\nالتواصل، العمل الجماعي، إدارة الوقت",
    "language": "ar",
    "seniority": "mid"
  }
}'

echo "]"
