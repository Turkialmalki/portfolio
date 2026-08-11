/**
 * SYNTHETIC ANALYSIS-ENGINE FIXTURES (Command 05 §36).
 *
 * Fictional resumes only — no real CVs, no customer data, no operator
 * CV content. Each fixture is plain resume TEXT (unlike the methodology
 * harness's pre-scored fixtures) because these exercise the FULL
 * pipeline: preprocessing, redaction, structure extraction, retrieval,
 * the mock AI provider, evidence verification, fact preservation, and
 * deterministic scoring.
 */
import type { AnalyzeResumeRequest } from "../../functions/_shared/analysis/types.ts";

export interface AnalysisFixture {
  name: string;
  description: string;
  request: AnalyzeResumeRequest;
}

const weakEntryEn = `Noor Fictional
noor.fictional@example.com | 555-010-0100

Summary
Highly motivated results-driven recent graduate seeking a challenging opportunity.

Experience
Intern - Fictional Retail Co
2025 - Present
- Responsible for the management of the customer service desk.
- Worked on various projects.
- Helped with inventory.

Education
BSc Business Administration, Fictional State University, 2025

Skills
Excel, PowerPoint, Communication, Teamwork, Leadership, Customer Service, Time Management`;

const strongSeniorEn = `Sami Testcase
Summary
Senior backend engineer specializing in distributed payment systems, with a track record of owning reliability end-to-end.

Experience
Senior Backend Engineer - Fictional Payments Inc
2022 - Present
- Led the redesign of the settlement pipeline, reducing failed transactions by 18% across three markets.
- Owned on-call rotation for the core ledger service, mentoring two engineers into the rotation.
- Architected a rate-limiting layer that eliminated the recurring outage class from the prior quarter.

Backend Engineer - Fictional Systems Ltd
2019 - 2022
- Built the initial event-sourcing pipeline used by four downstream teams.
- Reduced deployment time from 40 minutes to 6 minutes by automating the release pipeline.

Education
BSc Computer Science, Fictional Institute of Technology, 2019

Skills
Go, Kubernetes, PostgreSQL, distributed systems, on-call ownership, mentoring`;

const managerTasksOnlyEn = `Reem Placeholder
Summary
Engineering manager.

Experience
Engineering Manager - Fictional Software Co
2021 - Present
- Attended sprint planning meetings.
- Reviewed pull requests.
- Updated the project tracker weekly.
- Wrote status reports for stakeholders.

Education
BSc Software Engineering, Fictional University, 2015

Skills
Jira, Confluence, Scrum`;

const arabicGeneric = `مثال افتراضي
الملخص المهني
موظف يسعى إلى تحقيق النجاح والتميز في مكان العمل.

الخبرة العملية
موظف مبيعات - شركة افتراضية
2020 - الآن
- المسؤول عن متابعة العملاء.
- العمل على مهام متنوعة حسب الحاجة.

التعليم
بكالوريوس إدارة أعمال، جامعة افتراضية، 2019

المهارات
التواصل، العمل الجماعي، إدارة الوقت`;

const strongNoMetricsEn = `Firas Synthetic
Summary
Senior infrastructure specialist focused on confidential financial-sector systems.

Experience
Senior Infrastructure Engineer - Fictional Bank Group
2020 - Present
- Owned migration of the core trading platform onto a resilient multi-region architecture.
- Directed the incident-response process for the settlement systems team, cutting recurring escalations.
- Designed the access-control model adopted across the technology division.

Infrastructure Engineer - Fictional Financial Services
2016 - 2020
- Implemented the disaster-recovery runbook still in use by the platform team.
- Improved deployment reliability for the core banking systems.

Education
BSc Computer Engineering, Fictional Technical University, 2016

Skills
distributed systems, access control, incident response, disaster recovery`;

const jdMatchPartialEn = `Dana Testcase
Summary
Data analyst experienced in SQL reporting and dashboarding for retail operations.

Experience
Data Analyst - Fictional Retail Analytics Co
2021 - Present
- Built recurring SQL reports used by the operations team.
- Owned the weekly dashboard reviewed by store managers.

Education
BSc Statistics, Fictional State University, 2020

Skills
SQL, dashboarding, Excel`;

const jdText = "We need a Data Analyst with strong SQL, dashboarding, stakeholder reporting, and forecasting experience.";

const noJdMidEn = `Karim Placeholder
Summary
Mid-level project coordinator with three years of cross-functional delivery experience.

Experience
Project Coordinator - Fictional Consulting Group
2022 - Present
- Coordinated delivery schedules across three client engagements.
- Tracked project budgets and flagged risks to stakeholders weekly.

Education
BSc Management, Fictional University, 2021

Skills
project coordination, stakeholder communication, budgeting`;

const malformedShort = `Too short.`;

const conflictingMetricsEn = `Lina Conflictcase
Summary
Operations lead with a record of process improvement.

Experience
Operations Lead - Fictional Logistics Co
2021 - Present
- Increased the on-time delivery rate by 20% in Q1.
- A later summary of the same initiative reported the on-time delivery rate by 35%.

Education
BSc Logistics, Fictional University, 2018

Skills
process improvement, logistics, vendor management`;

const polishedNoEvidenceEn = `Lina Mockdata
Summary
Dynamic, passionate, results-driven executive with a proven track record of transformative success across industries.

Experience
Head of Strategy - Fictional Holdings Group
2020 - Present
- Drove synergy across the organization.
- Delivered results-driven initiatives that transformed the business.
- Championed a dynamic culture of excellence.

Education
MBA, Fictional Business School, 2015

Skills
leadership, strategy, synergy, excellence`;

const hrManagerEn = `Yasmin Placeholder
Summary
HR manager with experience leading recruiting and employee relations programs.

Experience
HR Manager - Fictional Manufacturing Co
2020 - Present
- Led the recruiting team through a hiring surge, reducing time-to-hire from six weeks to three.
- Owned the employee relations process for a workforce of 400 people.
- Redesigned the onboarding program adopted company-wide.

Education
BSc Human Resources Management, Fictional University, 2016

Skills
recruiting, employee relations, onboarding, performance management`;

const marketingEn = `Omar Placeholder
Summary
Marketing professional specializing in lifecycle campaigns for consumer apps.

Experience
Marketing Manager - Fictional Consumer Apps Inc
2021 - Present
- Owned the lifecycle email program, improving 30-day retention by 12%.
- Directed a rebrand of the onboarding flow adopted across all products.
- Managed a $50,000 quarterly paid-acquisition budget.

Education
BSc Marketing, Fictional University, 2018

Skills
lifecycle marketing, retention, paid acquisition, campaign management`;

export const ALL_ANALYSIS_FIXTURES: AnalysisFixture[] = [
  { name: "weak_entry_english", description: "Weak entry-level English CV.", request: { resumeText: weakEntryEn, language: "en", seniority: "entry" } },
  {
    name: "strong_senior_english",
    description: "Strong senior engineer with a target role and JD.",
    request: { resumeText: strongSeniorEn, language: "en", seniority: "senior", targetRole: "Senior Backend Engineer", jobDescription: "Distributed systems, on-call ownership, mentoring." },
  },
  { name: "manager_tasks_only", description: "Manager CV that is entirely individual task descriptions.", request: { resumeText: managerTasksOnlyEn, language: "en", seniority: "manager" } },
  { name: "arabic_generic", description: "Generic Arabic CV, no target role/JD.", request: { resumeText: arabicGeneric, language: "ar", seniority: "mid" } },
  { name: "strong_no_metrics", description: "Strong technical CV with zero numeric metrics.", request: { resumeText: strongNoMetricsEn, language: "en", seniority: "senior", industry: "banking_financial_services" } },
  { name: "job_match_partial", description: "Partial JD match with a target role.", request: { resumeText: jdMatchPartialEn, language: "en", seniority: "mid", targetRole: "Data Analyst", jobDescription: jdText } },
  { name: "no_jd_provided", description: "No target role, no JD — contextual dimensions must be excluded, never zeroed.", request: { resumeText: noJdMidEn, language: "en", seniority: "mid" } },
  { name: "malformed_too_short", description: "Malformed/very short resume — must fail request validation before any AI call.", request: { resumeText: malformedShort, language: "en", seniority: "entry" } },
  { name: "conflicting_metrics", description: "Same metric reported with two different percentages.", request: { resumeText: conflictingMetricsEn, language: "en", seniority: "mid" } },
  { name: "polished_no_evidence", description: "Polished, buzzword-heavy language with no checkable evidence.", request: { resumeText: polishedNoEvidenceEn, language: "en", seniority: "senior" } },
  { name: "hr_manager", description: "HR manager — must not receive engineering-domain retrieval.", request: { resumeText: hrManagerEn, language: "en", seniority: "manager" } },
  { name: "marketing_professional", description: "Marketing professional — must not receive fintech-specific retrieval.", request: { resumeText: marketingEn, language: "en", seniority: "mid" } },
];
