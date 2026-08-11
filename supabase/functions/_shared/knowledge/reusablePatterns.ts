/**
 * Command 04 §7, §10–§18 — the abstraction layer: reusable writing
 * patterns and the anti-pattern library, distilled from the operator-CV
 * units WITHOUT carrying any operator fact forward (§8).
 *
 * Everything in this file is generic by construction: slot templates and
 * guidance only. The harness asserts no operator-identifying term or
 * operator metric appears anywhere in this module's payloads.
 */
import type { AntiPattern, ReusablePattern } from "./types.ts";

// ── §10 Bullet patterns — several shapes, never one forced formula ───────
export const BULLET_PATTERNS: ReusablePattern[] = [
  {
    patternId: "bp-action-ownership-scope-outcome",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Action + ownership + scope + outcome",
    slots: ["ACTION", "OWNERSHIP", "SCOPE", "OUTCOME"],
    template:
      "Led the development of [product] using [core technologies], contributing to [verified outcome 1] and [verified outcome 2].",
    guidance:
      "The workhorse achievement bullet. 'Contributing to' is the honest attribution verb for team results the person genuinely drove — stronger than overclaiming, more credible than hiding. Outcomes must come from the user's own verified facts; if none exist, ask the missing-evidence question instead of filling the slot.",
    applicableSeniority: ["mid", "senior", "lead"],
    language: "en",
    dimensionIds: ["experience_quality", "achievement_impact"],
    derivedFromUnitIds: ["u-arj-led-2026"],
  },
  {
    patternId: "bp-outcome-mechanism-tools",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Outcome first, then mechanism",
    slots: ["OUTCOME", "MECHANISM", "TOOLS"],
    template:
      "Improved [measured result] through the development of [product/system] using [tools].",
    guidance:
      "Leading with the result suits bullets whose metric is the headline. Only usable when the result is a real measured fact; an assertion ('improved user experience') in the outcome slot collapses the pattern.",
    applicableSeniority: ["entry", "mid", "senior", "lead"],
    language: "en",
    dimensionIds: ["achievement_impact"],
    derivedFromUnitIds: ["u-arj-downloads-2023"],
  },
  {
    patternId: "bp-mechanism-named-system-purpose",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Mechanism + named system + purpose (no metric needed)",
    slots: ["ACTION", "MECHANISM BUILT", "NAMED EXTERNAL SYSTEM", "PURPOSE"],
    template:
      "Optimized [system area] by developing [the thing you built] to interface with [named external system] for [business purpose].",
    guidance:
      "The metric-free strong bullet: credibility comes from the concrete artifact built and the named system it talks to. Use when honest numbers don't exist — a named mechanism beats an invented percentage every time.",
    applicableSeniority: ["mid", "senior", "lead"],
    language: "en",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    derivedFromUnitIds: ["u-arj-middleware", "u-mun-integrations"],
  },
  {
    patternId: "bp-leadership-team-delivery-scope",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Leadership + team + delivery + scope",
    slots: ["LEADERSHIP", "TEAM", "DELIVERABLE", "TECHNICAL SCOPE"],
    template:
      "Led a cross-functional engineering team to deliver [product], overseeing [area 1], [area 2], and [area 3].",
    guidance:
      "The minimal complete manager bullet: who was led, what shipped, what surface was overseen. Team size strengthens it when the user can state one — ask, never estimate.",
    applicableSeniority: ["lead", "manager", "director"],
    language: "en",
    dimensionIds: ["leadership_ownership", "experience_quality"],
    derivedFromUnitIds: ["u-mun-team"],
  },
  {
    patternId: "bp-practice-establishment",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Practice establishment (senior influence without reports)",
    slots: ["ESTABLISHED", "PRACTICES", "QUALITATIVE PURPOSE"],
    template:
      "Established [architecture/practice 1], [practice 2], and [practice 3] to improve [qualitative outcome].",
    guidance:
      "Shows senior-level influence without people management: practices others then work within. The outcome is legitimately qualitative — do not decorate maintainability with a number.",
    applicableSeniority: ["senior", "lead"],
    language: "en",
    dimensionIds: ["experience_quality", "leadership_ownership"],
    derivedFromUnitIds: ["u-arj-frontarch-2026"],
  },
  {
    patternId: "bp-remit-transformation",
    kind: "bullet",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Remit transformation (manager altitude)",
    slots: ["REMIT", "INPUT STATE", "OUTPUT STATE", "QUALITY CRITERIA"],
    template:
      "Lead [function] for [portfolio/beneficiary], turning [input state] into [output state] with a focus on [quality criteria].",
    guidance:
      "A manager role's opening bullet: the transformation owned, at portfolio altitude, before any project detail. If a document at manager level has no bullet at this altitude, that absence is itself the finding.",
    applicableSeniority: ["manager", "director", "executive"],
    language: "en",
    dimensionIds: ["leadership_ownership", "seniority_alignment"],
    derivedFromUnitIds: ["u-mon-innovation-2026"],
  },
];

// ── §14 Summary patterns — different users need different positioning ────
export const SUMMARY_PATTERNS: ReusablePattern[] = [
  {
    patternId: "sp-manager-three-sentence",
    kind: "summary",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Manager summary: identity → technical depth → leadership",
    slots: ["IDENTITY + DOMAIN + SECTORS", "TECHNICAL AREAS", "COLLABORATION + LEADERSHIP SIGNAL"],
    template:
      "[Role] with [N]+ years leading [team type] in [domain], delivering [platform type] across [sectors]. Experienced in [2–3 technical areas]. Strong background [collaboration surface] while [leadership signal] and [strategic signal].",
    guidance:
      "Three sentences, three jobs: who at what level in what domain; what technical ground is covered (trim to what the target role cares about); how they lead. No numbers unless verified, no 'seeking' clause, no 'proven track record'.",
    applicableSeniority: ["lead", "manager", "director"],
    language: "en",
    dimensionIds: ["professional_summary", "positioning"],
    derivedFromUnitIds: ["u-sum-2026"],
  },
  {
    patternId: "sp-specialization-variant",
    kind: "summary",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Per-target specialization variants",
    slots: ["STABLE SKELETON", "SWAPPABLE SPECIALIZATION SLOT"],
    template:
      "[Identical truthful summary skeleton], with the specialization slot ([e.g. payments / architecture / people leadership]) swapped to match each target role.",
    guidance:
      "Maintaining summary variants that differ only in the emphasized specialization is legitimate targeting — the facts never change, only which true thing leads. Distinct from rewriting the self per application, which produces contradiction.",
    applicableSeniority: ["mid", "senior", "lead", "manager", "director", "executive"],
    language: "en",
    dimensionIds: ["professional_summary", "target_role_alignment"],
    derivedFromUnitIds: ["u-sum-mgmt", "u-sum-arch"],
  },
  {
    patternId: "sp-ic-identity-domain",
    kind: "summary",
    contentClass: "STRUCTURAL_PATTERN",
    name: "IC summary: identity + domain + one proof point",
    slots: ["ROLE + YEARS", "DOMAIN/SPECIALIZATION", "ONE CHECKABLE CLAIM"],
    template:
      "[Role], [N] years in [domain], specialized in [specific area]; [one distinctive, checkable claim from the experience section].",
    guidance:
      "For individual contributors: identity and specialization in one breath plus a single claim the experience section can prove. Kept deliberately shorter than the manager shape — an entry/mid summary that talks strategy misaligns seniority.",
    applicableSeniority: ["entry", "mid", "senior"],
    language: "en",
    dimensionIds: ["professional_summary", "seniority_alignment"],
    derivedFromUnitIds: ["u-sum-2026"],
  },
];

// ── §13 Project-description patterns ─────────────────────────────────────
export const PROJECT_PATTERNS: ReusablePattern[] = [
  {
    patternId: "pp-integration-project",
    kind: "project",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Integration project: constraint + named systems",
    slots: ["ACTION PAIR", "CONSTRAINT", "NAMED SYSTEMS"],
    template:
      "Architected and launched a [constraint-bearing, e.g. regulation-compliant] system integrated with [named external system 1], [2], and [3].",
    guidance:
      "Named third-party systems are self-authenticating: readers who know the domain know what integrating them takes. Verb pairs ('architected and launched') compactly claim design-through-delivery. Works for fintech, government, healthcare — anywhere integrations are gatekept.",
    applicableSeniority: ["senior", "lead", "manager"],
    language: "en",
    dimensionIds: ["evidence_specificity", "experience_quality"],
    derivedFromUnitIds: ["u-mun-integrations"],
  },
  {
    patternId: "pp-internal-system",
    kind: "project",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Internal system: named artifact + organizational customer",
    slots: ["NAMED ARTIFACT", "CAPABILITY", "TOOL", "ORGANIZATIONAL PURPOSE"],
    template:
      "Established [named internal artifact] and [capability] via [tool] to [organizational purpose].",
    guidance:
      "Internal/back-office work becomes credible when the artifact has a name and an internal customer. The outcome may be a purpose when no honest measurement exists — a real purpose beats a fake percentage.",
    applicableSeniority: ["mid", "senior", "lead", "manager"],
    language: "en",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    derivedFromUnitIds: ["u-mon-metabase"],
  },
  {
    patternId: "pp-platform-revamp",
    kind: "project",
    contentClass: "STRUCTURAL_PATTERN",
    name: "Platform revamp / modernization",
    slots: ["END-TO-END OWNERSHIP", "NAMED SCOPE", "STACK", "PURPOSE", "SURFACES"],
    template:
      "Led the end-to-end revamp of [platform scope], using [technologies] to [improvement purpose] across [surfaces].",
    guidance:
      "'End-to-end' earns its place only when the scope is named. On leadership documents, add the team dimension — a revamp with no people led reads as an IC project. Outcome slot: verified facts only, else ask.",
    applicableSeniority: ["senior", "lead", "manager"],
    language: "en",
    dimensionIds: ["experience_quality", "leadership_ownership"],
    derivedFromUnitIds: ["u-mon-revamp-2024", "u-emk-revamp-2023"],
  },
  {
    patternId: "pp-mvp-startup",
    kind: "project",
    contentClass: "STRUCTURAL_PATTERN",
    name: "MVP / startup delivery",
    slots: ["DECISION-MAKER PROXIMITY", "PRODUCT DECISIONS", "MILESTONE"],
    template:
      "Worked directly with [founders/decision-makers] to shape [product decisions] and deliver [milestone].",
    guidance:
      "In startup contexts the scope signals are proximity to decision-makers and shipped milestones. Let the milestone speak for itself — 'successful' is the reader's judgment, not the writer's.",
    applicableSeniority: ["senior", "lead", "manager"],
    language: "en",
    dimensionIds: ["experience_quality"],
    derivedFromUnitIds: ["u-mun-mvp"],
  },
];

// ── §11–§12 Leadership & technical guidance patterns ─────────────────────
export const LEADERSHIP_PATTERNS: ReusablePattern[] = [
  {
    patternId: "lp-people-development-scope",
    kind: "leadership",
    contentClass: "ROLE_GUIDANCE",
    name: "People development with head-count scope",
    slots: ["MENTEE COUNT", "MECHANISMS"],
    template:
      "People development: mentoring [N]+ engineers through [1:1 coaching / performance reviews / progression planning].",
    guidance:
      "People-leadership becomes checkable when head-count scope and concrete mechanisms are stated. The count must be the user's own — ask for it; never estimate from role or company size.",
    applicableSeniority: ["lead", "manager", "director"],
    language: "en",
    dimensionIds: ["leadership_ownership", "evidence_specificity"],
    derivedFromUnitIds: ["u-comp-mentoring"],
  },
  {
    patternId: "lp-owned-artifacts",
    kind: "leadership",
    contentClass: "ROLE_GUIDANCE",
    name: "Leadership as owned artifacts",
    slots: ["DIRECTION ARTIFACT", "STANDARDS ARTIFACT", "PLANNING ARTIFACT", "STAKEHOLDER SURFACE"],
    template:
      "Define [technical direction], [engineering standards], and [delivery plans] while working with [stakeholder functions] to deliver [outcome quality].",
    guidance:
      "Manager leadership is legible as the artifacts owned — direction, standards, plans — plus the stakeholder surface they cross. This is the shape to reach for when a manager document is all adjectives ('strong leader') and no owned decisions.",
    applicableSeniority: ["manager", "director"],
    language: "en",
    dimensionIds: ["leadership_ownership"],
    derivedFromUnitIds: ["u-mon-direction-2026"],
  },
  {
    patternId: "lp-altitude-review-verbs",
    kind: "leadership",
    contentClass: "ROLE_GUIDANCE",
    name: "Altitude-honest technical verbs at manager+",
    slots: ["REVIEW/GUIDE VERB", "ARCHITECTURE AREAS", "TEAMS"],
    template:
      "Review [architecture areas], collaborating with [teams] on solutions using [core stack].",
    guidance:
      "At manager level and above, 'review', 'guide', and 'direct' are the honest technical verbs; claiming hands-on building misaligns the document's altitude. Keeps technical credibility visible without cosplaying as an IC.",
    applicableSeniority: ["manager", "director", "executive"],
    language: "en",
    dimensionIds: ["seniority_alignment", "leadership_ownership"],
    derivedFromUnitIds: ["u-mon-arch-review-2026"],
  },
];

export const TECHNICAL_PATTERNS: ReusablePattern[] = [
  {
    patternId: "tp-tech-inside-action",
    kind: "technical",
    contentClass: "LANGUAGE_PATTERN",
    name: "Technology belongs inside the action",
    slots: ["ACTION", "PRODUCT", "TECHNOLOGY", "USER/BUSINESS PURPOSE"],
    template: "Built [product/interface] using [technology] to support [user/business purpose].",
    guidance:
      "Technology alone is not an achievement. A technology earns its mention by sitting inside an action that served a purpose — never as a parenthesized dump or a bare list. If the purpose slot can't be filled truthfully, the bullet isn't ready.",
    applicableSeniority: ["entry", "mid", "senior", "lead"],
    language: "en",
    dimensionIds: ["experience_quality", "skills_relevance"],
    derivedFromUnitIds: ["u-arj-impl-2023", "u-arj-led-2026"],
  },
  {
    patternId: "tp-regulated-constraint",
    kind: "technical",
    contentClass: "ROLE_GUIDANCE",
    name: "Regulatory constraints are evidence in regulated industries",
    slots: ["DEPLOYMENT/BUILD ACTION", "SYSTEMS", "NAMED CONSTRAINT"],
    template: "Deployed [systems] on [platform], meeting [named regulatory/operational constraint].",
    guidance:
      "In banking, government, and health contexts, naming the compliance framework the work satisfied is substantive evidence, not filler — and often the honest substitute for confidential numbers.",
    applicableSeniority: ["mid", "senior", "lead", "manager"],
    language: "en",
    dimensionIds: ["evidence_specificity"],
    derivedFromUnitIds: ["u-emk-k8s"],
  },
  {
    patternId: "tp-honest-collaboration-verb",
    kind: "technical",
    contentClass: "LANGUAGE_PATTERN",
    name: "'Partnered with' for genuinely shared work",
    slots: ["PARTNER VERB", "TEAMS", "DELIVERABLES"],
    template: "Partnered with [teams] to deliver [deliverable 1], [deliverable 2], and [deliverable 3].",
    guidance:
      "'Partnered with' is the truthful verb for shared work — more credible than inflating to 'led', more substantive than 'worked closely with' when followed by concrete deliverables. Cap the list at three so each stays visible.",
    applicableSeniority: ["mid", "senior", "lead"],
    language: "en",
    dimensionIds: ["language_quality", "experience_quality"],
    derivedFromUnitIds: ["u-emk-cicd-2026", "u-arj-collab-2026"],
  },
];

export const ALL_PATTERNS: ReusablePattern[] = [
  ...BULLET_PATTERNS,
  ...SUMMARY_PATTERNS,
  ...PROJECT_PATTERNS,
  ...LEADERSHIP_PATTERNS,
  ...TECHNICAL_PATTERNS,
];

// ── §18 Anti-pattern library — how NOT to write (and how AI over-writes) ─
export const ANTI_PATTERNS: AntiPattern[] = [
  {
    antiPatternId: "ap-tech-dump-parens",
    name: "Parenthesized technology dump",
    description: "Technologies listed in parentheses, detached from any action.",
    example: "Implemented and designed the app with extensive knowledge of ([six technologies]).",
    whyBad:
      "'With extensive knowledge of' praises the author instead of describing work; the parens make the tools decoration rather than evidence.",
    detection: "Parenthesized comma lists of 3+ technologies; 'with (extensive) knowledge of'.",
    dimensionIds: ["experience_quality", "language_quality"],
    derivedFromUnitIds: ["u-arj-impl-2023", "u-emk-portal-2023"],
  },
  {
    antiPatternId: "ap-vapor-outcome",
    name: "Vapor outcome",
    description: "A result clause asserting a feeling instead of a change.",
    example: "…which led to customer satisfaction. / …delivering new features with improved customer satisfaction.",
    whyBad:
      "Unfalsifiable and unmeasured — it asserts an emotion, not an observable. The bullet would be stronger ending at the concrete work.",
    detection:
      "Outcome clauses containing satisfaction/happiness/delight with no observable; 'improved user experience' with no evidence.",
    dimensionIds: ["achievement_impact", "evidence_specificity"],
    derivedFromUnitIds: ["u-emk-portal-2023", "u-arj-rd-2023"],
  },
  {
    antiPatternId: "ap-implausible-metric",
    name: "Implausible or mutated metric",
    description: "A percentage attached to something that isn't a quantity, or a metric whose measured noun drifted between edits.",
    example: "…increasing customer satisfaction by [triple-digit]%.",
    whyBad:
      "Satisfaction is not a quantity that can grow by a triple-digit percentage; readers discount every other number in the document once one metric reads as invented. Flag for confirmation — never 'fix' by picking a number.",
    detection:
      "Percentages > 100 on abstract nouns; the same figure attached to different nouns across versions; suspiciously uniform round numbers.",
    dimensionIds: ["evidence_specificity", "achievement_impact"],
    derivedFromUnitIds: ["u-emk-portal-2026", "u-emk-java-150"],
  },
  {
    antiPatternId: "ap-unverifiable-quality-metric",
    name: "Unverifiable quality percentage",
    description: "A precise number on an unmeasured abstraction.",
    example: "…improving platform quality by [N]% / enhancing quality by [N]%.",
    whyBad:
      "'Quality' was never measured; the precision is fake. One unverifiable number taxes the credibility of every real one.",
    detection: "Percentages attached to quality/excellence/efficiency with no named measurement.",
    dimensionIds: ["evidence_specificity"],
    derivedFromUnitIds: ["u-sum-2023", "u-sum-mgmt"],
  },
  {
    antiPatternId: "ap-seeking-objective",
    name: "The 'seeking' objective",
    description: "Summary ends by asking rather than offering.",
    example: "Seeking to leverage my expertise to enhance business operations…",
    whyBad:
      "Spends prime first-page space on what the candidate wants instead of what the reader gets; reads junior at every seniority.",
    detection: "'Seeking', 'looking for an opportunity', 'to utilize my skills' in summaries.",
    dimensionIds: ["professional_summary", "content_prioritization"],
    derivedFromUnitIds: ["u-sum-2023", "u-sum-2024em"],
  },
  {
    antiPatternId: "ap-everything-bullet",
    name: "The everything-bullet",
    description: "One bullet claiming five-plus improvement areas.",
    example: "Improved performance, monitoring, observability, accessibility, and standards while reducing technical debt and improving release quality.",
    whyBad:
      "Past ~three claims, each additional area subtracts credibility — the reader believes nothing specifically. Also the shape AI assistants produce when asked to 'make it comprehensive'.",
    detection: "Bullets with 4+ improvement claims and zero observables.",
    dimensionIds: ["experience_quality", "redundancy_noise"],
    derivedFromUnitIds: ["u-emk-perf-2026"],
  },
  {
    antiPatternId: "ap-fake-executive-tone",
    name: "Fake executive tone",
    description: "Chained abstractions with an absolute claim.",
    example: "Partner with cross-functional stakeholders to align technical roadmaps with business goals while ensuring 100% compliance.",
    whyBad:
      "Sounds strategic, says nothing checkable: no named stakeholder, decision, or observable. Real strategic bullets survive 'which stakeholders, which decision, what happened?'",
    detection:
      "Sentences whose every noun is abstract (stakeholders/roadmaps/goals/alignment) plus absolutes (100%, 'all', 'fully').",
    dimensionIds: ["evidence_specificity", "language_quality"],
    derivedFromUnitIds: ["u-mon-compliance"],
  },
  {
    antiPatternId: "ap-participation-as-leadership",
    name: "Participation dressed as leadership",
    description: "'Led' or a department claim without scope or owned decisions.",
    example: "Led the department to focus on [theme], delivering [generic outcome].",
    whyBad:
      "Leadership claims without team size, remit, or a checkable result read as attendance. Downgrades trust in the document's real leadership content.",
    detection: "'Led' + no scope + no outcome; leadership adjectives with no owned decision anywhere.",
    dimensionIds: ["leadership_ownership", "evidence_specificity"],
    derivedFromUnitIds: ["u-arj-rd-2023"],
  },
  {
    antiPatternId: "ap-ceremony-minutiae",
    name: "Ceremony minutiae on leadership documents",
    description: "Table-stakes process rituals presented as achievements.",
    example: "Implemented structured workflows, including chat-based standups, to improve coordination.",
    whyBad:
      "Describes what every competent holder of the role does by default; the line displaces a real outcome. Prioritization noise.",
    detection: "Standups, ceremonies, 'introduced code reviews' (existing at all) as standalone bullets at lead+.",
    dimensionIds: ["content_prioritization", "seniority_alignment"],
    derivedFromUnitIds: ["u-twq-standups"],
  },
  {
    antiPatternId: "ap-ai-verb-costume",
    name: "AI verb costume",
    description: "Grandiose verbs where plain ones are natural, and uniform sentence machinery.",
    example: "Spearheaded… Leveraged… Orchestrated… Revolutionized… Pioneered… (every bullet, same shape)",
    whyBad:
      "Excessive Spearheaded/Leveraged/Orchestrated/Revolutionized/Pioneered, identical bullet skeletons, unnecessary adjectives, and quantified-looking language are the recognizable texture of AI-generated CV prose. The engine must sound like a person: plain strong verbs, varied structure, facts over costume.",
    detection:
      "Grandiose-verb density; >2 bullets in a role opening with the same verb; every bullet ending '…resulting in [X]% [abstraction]'; 'results-driven'/'dynamic professional'/'proven track record' in summaries.",
    dimensionIds: ["language_quality", "professional_summary"],
    derivedFromUnitIds: ["u-sum-2023", "u-emk-java-150"],
  },
  {
    antiPatternId: "ap-title-inflation-static-register",
    name: "Bigger title, same register",
    description: "The title rises between versions; the prose stays at the old level.",
    example: "[Bigger title] with over [N] years of a broad set of skills… (body unchanged from the junior version)",
    whyBad:
      "A manager title on mid-level prose is a seniority-alignment failure the reader feels immediately — the claimed level and the demonstrated level disagree.",
    detection: "Title/level claims not reflected in any bullet's altitude; summaries interchangeable across levels.",
    dimensionIds: ["seniority_alignment", "positioning"],
    derivedFromUnitIds: ["u-sum-2024em"],
  },
];
