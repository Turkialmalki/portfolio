/**
 * DETERMINISM SUITE FIXTURES (Career V2 Part 28).
 *
 * "Weak English, strong English, Arabic, management, no metrics, complex
 * finance CV" — five of the six reuse the analysis suite's existing
 * fixtures by reference (`ALL_ANALYSIS_FIXTURES`), so there is exactly one
 * definition of each resume text in the repo, not a second copy that could
 * drift; "complex finance CV" is new here.
 */
import type { AnalyzeResumeRequest } from "../../functions/_shared/analysis/types.ts";
import { ALL_ANALYSIS_FIXTURES } from "../analysis/fixtures.ts";

export interface DeterminismFixture {
  name: string;
  description: string;
  request: AnalyzeResumeRequest;
}

function reuse(analysisFixtureName: string, describeAs: string): DeterminismFixture {
  const found = ALL_ANALYSIS_FIXTURES.find((f) => f.name === analysisFixtureName);
  if (!found) throw new Error(`determinism fixtures: no analysis fixture named "${analysisFixtureName}"`);
  return { name: found.name, description: describeAs, request: found.request };
}

const complexFinanceCv = `Yousef Fictional
Summary
VP of Finance with 12 years across corporate FP&A, treasury, and M&A integration, currently leading a 9-person finance team across three business units.

Experience
VP Finance - Fictional Holdings Group
2021 - Present
- Led the finance integration of two acquisitions totaling $340M in combined revenue, consolidating reporting onto one ERP within 5 months.
- Restructured the FP&A forecasting model, cutting the monthly close cycle from 12 business days to 6.
- Managed a $1.2B treasury portfolio across four currencies, reducing FX hedging costs by 14% year over year.
- Presented quarterly results and scenario models directly to the board and audit committee.

Director of FP&A - Fictional Bank Corp
2016 - 2021
- Built the bank's first rolling 18-month forecast model, adopted across five business lines.
- Partnered with the CFO on a $75M cost-reduction program, tracking savings against a monthly scorecard.
- Managed a team of four analysts covering commercial banking and wealth management segments.

Senior Financial Analyst - Fictional Capital Partners
2013 - 2016
- Supported due diligence on 6 acquisition targets, building standalone and combined valuation models.
- Automated the monthly variance-reporting package, reducing preparation time by 60%.

Education
MBA Finance, Fictional School of Business, 2013
BSc Accounting, Fictional State University, 2009

Skills
FP&A, treasury management, M&A integration, financial modeling, board reporting, SAP, Hyperion, Excel (advanced)

Certifications
CFA Charterholder
CPA`;

export const DETERMINISM_FIXTURES: DeterminismFixture[] = [
  reuse("weak_entry_english", "Weak English CV — determinism check."),
  reuse("strong_senior_english", "Strong English CV — determinism check."),
  reuse("arabic_generic", "Arabic CV — determinism check."),
  reuse("manager_tasks_only", "Management-level CV — determinism check."),
  reuse("strong_no_metrics", "Strong CV with no numeric metrics — determinism check."),
  {
    name: "complex_finance_cv",
    description: "Complex, multi-role finance/VP CV with heavy figures — determinism check.",
    request: { resumeText: complexFinanceCv, language: "en", seniority: "director", industry: "banking_financial_services" },
  },
];
