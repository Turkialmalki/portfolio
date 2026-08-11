/**
 * Command 04 §2–§3 — extracted, evaluated content units from the five
 * distinct operator-CV versions.
 *
 * Evaluation rules applied here:
 *  - quality is judged by career_methodology_v1 (bullet-quality scale,
 *    dimension rubrics), NOT by "it's the operator's CV so it's good" (§4);
 *  - `rawText` is the source fact — OPERATOR_SPECIFIC_FACT, kept only in
 *    the service-role knowledge workspace (§20);
 *  - `patternText` is the anonymized reusable abstraction: slot
 *    placeholders, no operator names, no operator metrics (§7–§8);
 *  - nothing here infers a fact absent from the sources (§2): conflicting
 *    or implausible numbers become ReviewFlags with missing-evidence
 *    questions (§6), never a "fixed" value.
 */
import type { CvContentUnit, ReviewFlag } from "./types.ts";
import { sourceIdsForFingerprint } from "./operatorCvSources.ts";

const V1 = sourceIdsForFingerprint("fp-2023-lead-6yrs");
const V2 = sourceIdsForFingerprint("fp-2024-em-7yrs");
const V3 = sourceIdsForFingerprint("fp-2025-mgmt-8yrs");
const V4 = sourceIdsForFingerprint("fp-2025-arch-8yrs");
const V5 = sourceIdsForFingerprint("fp-2026-em-9yrs");

export const REVIEW_FLAGS: ReviewFlag[] = [
  {
    flagId: "flag-strapi-60-vs-80",
    kind: "conflicting_metric",
    affectedUnitIds: ["u-mon-strapi-60", "u-mon-strapi-80"],
    detail:
      "The same manual-data-handling reduction is stated as 60% in v2 and 80% in v3/v4. Both cannot be the verified figure. Neither number was taught to the knowledge base.",
    missingEvidenceQuestion:
      "Two CV versions describe the same automation outcome with different figures (60% and 80%). Which figure is supported by something you measured, and what exactly was measured?",
  },
  {
    flagId: "flag-satisfaction-150",
    kind: "metric_mutation",
    affectedUnitIds: ["u-emk-portal-2026", "u-emk-java-150", "u-emk-revamp-2023"],
    detail:
      "v1 states '150% increase in positive reviews' (a countable thing). Later versions restate this as 'increased customer satisfaction by 150%' — satisfaction is not a quantity that grows 150%, and the claim now measures something different from the source fact. Methodology rule: flag implausible/mutated metrics for confirmation, never silently fix.",
    missingEvidenceQuestion:
      "One version says positive reviews grew 150%; later versions say customer satisfaction grew 150%. Which is the real, measurable fact — and measured how?",
  },
  {
    flagId: "flag-quality-95",
    kind: "unverifiable_metric",
    affectedUnitIds: ["u-sum-2023", "u-sum-2024em", "u-sum-mgmt", "u-sum-arch"],
    detail:
      "'Improving platform quality by 95%' / 'enhancing quality by 95%' appears in four versions with no stated observable. 'Quality' is not a measured quantity here; the number cannot be verified from any source document.",
    missingEvidenceQuestion:
      "Your summary says quality improved by 95%. What was actually measured — crash rate, review scores, defect count, uptime — and is 95% the change in that measurement?",
  },
  {
    flagId: "flag-years-drift",
    kind: "inconsistent_experience_years",
    affectedUnitIds: ["u-sum-2023", "u-sum-2024em", "u-sum-mgmt", "u-sum-arch", "u-sum-2026"],
    detail:
      "Experience is stated as 6+, 7+, 8+ and 9+ years across versions. Consistent with the passage of time (2023→2026), so not an error — recorded so provenance stays honest and no single 'years' figure is treated as canonical.",
    missingEvidenceQuestion:
      "Confirm the current total years of experience to keep future material consistent (the versions span 6+ to 9+ years).",
  },
  {
    flagId: "flag-compliance-100",
    kind: "unverifiable_metric",
    affectedUnitIds: ["u-mon-compliance"],
    detail:
      "'Ensuring 100% regulatory compliance' is a boast-shaped absolute with no stated audit or observable behind it.",
    missingEvidenceQuestion:
      "You state 100% regulatory compliance. Is there a concrete observable behind this (an audit passed, zero findings in a review, a certification)?",
  },
];

export const CV_CONTENT_UNITS: CvContentUnit[] = [
  // ═══════════════ PROFESSIONAL SUMMARIES (5 versions) ═══════════════
  {
    unitId: "u-sum-2023",
    sourceIds: V1,
    rawText:
      "Engineering Leader with over 6 years of a broad set of skills applicable across different sectors and roles, crafting innovative solutions for top companies. I have successfully revolutionized digital channels of apps and web platforms, enhancing quality by 95% and driving substantial profitability across various development domains. … Seeking to leverage my expertise as an engineer to enhance business operations through my IT and leadership skills.",
    quality: "WEAK",
    contentType: "summary",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "engineering_leadership",
    industry: "technology",
    dimensionIds: ["professional_summary", "evidence_specificity", "language_quality"],
    evaluation:
      "Claims breadth ('broad set of skills', 'different sectors', 'various domains') instead of one identity; 'revolutionized' and 'crafting innovative solutions' are buzzword filler; 'enhancing quality by 95%' is an unverifiable metric; ends with a 'seeking to leverage' objective. Classic generic summary the methodology's summary rubric warns against.",
    patternText:
      "[Title] with over [N] years of a broad set of skills applicable across different sectors, crafting innovative solutions… seeking to leverage my expertise…",
    lesson:
      "A summary that claims breadth in every direction positions the candidate in none. Buzzword verbs plus an unverifiable percentage plus a 'seeking' objective is the canonical weak-summary shape — a strong BEFORE example.",
    reviewFlagIds: ["flag-quality-95", "flag-years-drift"],
  },
  {
    unitId: "u-sum-2024em",
    sourceIds: V2,
    rawText:
      "Engineering Manager with over 7 years of a broad set of skills applicable across different sectors and roles, crafting innovative solutions for top companies. … Seeking to leverage my expertise as an engineer to enhance business operations through my IT and leadership skills.",
    quality: "WEAK",
    contentType: "summary",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "technology",
    dimensionIds: ["professional_summary", "seniority_alignment"],
    evaluation:
      "Same generic body as v1 with only the title and years changed. A manager-level document whose summary is interchangeable with a mid-level one — the title claims more than the register delivers (seniority_alignment warning).",
    patternText:
      "[Bigger title] + [same generic summary body as the previous version]",
    lesson:
      "Raising the title without raising the register is a seniority-alignment failure: a manager summary must add scope, team, and outcome signals, not just a new job title on old prose.",
    reviewFlagIds: ["flag-quality-95", "flag-years-drift"],
  },
  {
    unitId: "u-sum-mgmt",
    sourceIds: V3,
    rawText:
      "Engineering Leader with 8+ years of experience leading high-performing software engineering teams across Fintech, semi-government, and innovation ecosystems. Proven track record of managing cross-functional squads (Backend, Frontend, QA) to deliver scalable payment and digital solutions while improving platform quality by 95%. Expert in driving technical roadmaps, fostering a culture of mentorship, and ensuring compliance with SAMA frameworks and Saudi regulations.",
    quality: "ACCEPTABLE",
    contentType: "summary",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["professional_summary", "positioning", "evidence_specificity"],
    evaluation:
      "Real structural progress: names level, domains, team composition, and a regulatory specialization — a reader can say who this is. Held back by 'proven track record' boilerplate and the unverifiable 'quality by 95%'. Acceptable, not a primary example.",
    patternText:
      "[Role] with [N]+ years leading [team type] across [domain 1], [domain 2] — managing cross-functional squads ([functions]) to deliver [solution type], with expertise in [regulatory/domain specialization].",
    lesson:
      "Identity + domains + team composition + specialization is a sound manager-summary skeleton; it degrades only where boilerplate ('proven track record') and unverifiable numbers creep in.",
    reviewFlagIds: ["flag-quality-95", "flag-years-drift"],
  },
  {
    unitId: "u-sum-arch",
    sourceIds: V4,
    rawText:
      "Engineering Leader with 8+ years of experience leading high-performing software engineering teams across Fintech, semi-government, and innovation ecosystems. Proven track record of managing cross-functional squads to deliver scalable System Architecture and digital solutions while improving platform quality by 95%. Expert in driving technical roadmaps, defining CI/CD processes, and ensuring seamless IT Integration within SAMA frameworks.",
    quality: "ACCEPTABLE",
    contentType: "summary",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["professional_summary", "positioning"],
    evaluation:
      "Same skeleton as v3 retargeted at architecture — a deliberate positioning variant per target role, which is itself good practice. Same weaknesses: 'proven track record', 'seamless', unverifiable 95%.",
    patternText:
      "[Same summary skeleton], with the specialization slot swapped to match a different target role.",
    lesson:
      "Maintaining summary variants that swap only the specialization slot per target role is a legitimate targeting technique — the skeleton stays truthful, only emphasis moves.",
    reviewFlagIds: ["flag-quality-95", "flag-years-drift"],
  },
  {
    unitId: "u-sum-2026",
    sourceIds: V5,
    rawText:
      "Engineering Manager with 9+ years of experience leading cross-functional engineering teams in fintech and digital products, delivering scalable web and mobile platforms across banking and government sectors. Experienced in system architecture, microservices-based ecosystems, REST API integrations, CI/CD pipelines, cloud-native engineering practices, and engineering excellence. Strong background collaborating with backend, DevOps, and product teams to build secure, high-performance, and scalable digital platforms while mentoring engineers and driving technical strategy.",
    quality: "STRONG",
    contentType: "summary",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["professional_summary", "positioning", "seniority_alignment"],
    evaluation:
      "Best of the five: one coherent identity (EM, fintech/digital, banking+government), no fake metrics, no 'seeking' objective, leadership and technical depth both present. Weakness: the middle sentence is a comma-list of technologies that pads length — noted in the lesson, and why this is a structural example rather than a copy-model.",
    patternText:
      "[Role] with [N]+ years leading [team type] in [domain], delivering [platform type] across [sectors]. Experienced in [2–3 technical areas]. Strong background [collaboration surface] while [leadership signal] and [strategic signal].",
    lesson:
      "Identity + domain + sectors first, technical depth second, leadership/strategy last — a manager summary in three sentences with zero invented numbers. Trim the technology list to the 2–3 areas the target role cares about.",
    reviewFlagIds: ["flag-years-drift"],
  },

  // ═══════════════ ALRAJHI BANK — Senior Software Engineer ═══════════════
  {
    unitId: "u-arj-impl-2023",
    sourceIds: V1,
    rawText:
      "Implemented and designed alrajhi mobile app with extensive knowledge of ( JavaScripts, Redux, REST API, Unit Testing, and Figma) resulting in a seamless user experience and 95% positive user feedback.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality", "language_quality"],
    evaluation:
      "'With extensive knowledge of' praises the author instead of describing work; parenthesized technology dump; 'seamless user experience' is filler; grammar errors ('JavaScripts', stray spaces). The real facts (built the app, 95% positive feedback) survive despite the writing — bullet-quality ~2.",
    patternText:
      "Implemented and designed [product] with extensive knowledge of ([technology dump]) resulting in a seamless user experience…",
    lesson:
      "'With extensive knowledge of' + a parenthesized tech dump is self-praise, not evidence. Technologies belong inside the action ('built X using Y'), and 'seamless' adds nothing a fact wouldn't say better.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-led-2026",
    sourceIds: V5,
    rawText:
      "Led the development of the Al Rajhi mobile application using React Native, JavaScript, Redux, and TypeScript, contributing to a 95% positive user satisfaction rate and a 90% increase in application downloads.",
    quality: "STRONG",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality", "achievement_impact", "evidence_specificity"],
    evaluation:
      "Ownership verb, named product, technologies inside the action, two source-supported outcomes, and honest attribution ('contributing to' — not claiming the whole result alone). Bullet-quality 5. The refined descendant of u-arj-impl-2023.",
    patternText:
      "Led the development of [product] using [core technologies], contributing to [verified outcome 1] and [verified outcome 2].",
    lesson:
      "ACTION + PRODUCT + TECHNOLOGY + VERIFIED OUTCOME with honest attribution: 'contributing to' credits a real personal role in a team result without overclaiming.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-downloads-2023",
    sourceIds: [...V1, ...V2, ...V3, ...V4],
    rawText:
      "Improved user experience and increased app downloads by 90% through the development and design of the Alrajhi mobile app using React Native and Figma.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["achievement_impact", "experience_quality"],
    evaluation:
      "Outcome-first structure (result → mechanism → tools) is sound and the metric is source-supported. 'Improved user experience' is an assertion without an observable; ownership is implicit rather than stated.",
    patternText:
      "Improved [outcome] and increased [measured result] through the development and design of [product] using [tools].",
    lesson:
      "OUTCOME + MECHANISM + TOOLS: leading with the result is a legitimate alternative to leading with the action — provided the result is a measured fact.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-sarie-2023",
    sourceIds: [...V1, ...V2],
    rawText:
      "Managed core banking system integrations with retail app to streamline financial operations ( Sarie - Saudi Payments ).",
    quality: "ACCEPTABLE",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    evaluation:
      "Names a real named system and a purpose — concrete and checkable. But 'managed integrations' hides what the person actually did, and there is no outcome.",
    patternText:
      "Managed [system type] integrations with [product] to [business purpose] ([named external system]).",
    lesson:
      "Naming the specific external system is strong evidence texture; the bullet still needs the person's own mechanism (built? designed? operated?) to score above 3.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-middleware",
    sourceIds: [...V2, ...V3, ...V4],
    rawText:
      "Optimized core banking integrations by developing Java-based middleware to interface with the Sarie (Saudi Payments) system for streamlined financial operations.",
    quality: "STRONG",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    evaluation:
      "The improved descendant of u-arj-sarie-2023: the person's mechanism is now explicit (developed Java middleware) and connected to a named system and purpose. No metric — and none needed; bullet-quality 4 without a number, exactly what the methodology says a metric-free 4 looks like.",
    patternText:
      "Optimized [system area] by developing [the thing you built] to interface with [named external system] for [business purpose].",
    lesson:
      "ACTION + MECHANISM + NAMED SYSTEM + PURPOSE. A technical bullet earns credibility from the concrete thing built and the named system it talks to — no percentage required.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-frontarch-2026",
    sourceIds: V5,
    rawText:
      "Established Clean Architecture, reusable component libraries, engineering standards, and code review practices to improve maintainability and application quality.",
    quality: "STRONG",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality", "leadership_ownership"],
    evaluation:
      "Senior-level craft leadership without people management: established practices others then work within, with an honest qualitative purpose instead of a manufactured metric. Exactly the informal-leadership signal the seniority model expects at senior.",
    patternText:
      "Established [architecture/practice 1], [practice 2], and [practice 3] to improve [qualitative outcome].",
    lesson:
      "Practice-establishment bullets show senior influence without direct reports. Their outcome is legitimately qualitative — do not bolt a number onto maintainability.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-collab-2026",
    sourceIds: V5,
    rawText:
      "Worked closely with Product Managers, UX/UI designers, backend engineers, and QA teams to deliver secure, customer-focused mobile banking experiences.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    dimensionIds: ["experience_quality"],
    evaluation:
      "'Worked closely with' is a participation verb — the stakeholder list is good context, but nothing here says what the person owned or changed. Bullet-quality 1–2.",
    patternText:
      "Worked closely with [stakeholder list] to deliver [adjective] [product area].",
    lesson:
      "A stakeholder list attached to 'worked closely with' is context without ownership. Fold the collaboration into a bullet that states what the person owned within it.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-arj-rd-2023",
    sourceIds: [...V1, ...V2],
    rawText:
      "Led the R&D dept. to focus on customer experience & innovation, delivering new features with improved customer satisfaction through real-time data analysis.",
    quality: "WEAK",
    contentType: "leadership",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "senior",
    roleFamily: "engineering_leadership",
    industry: "banking",
    dimensionIds: ["leadership_ownership", "evidence_specificity"],
    evaluation:
      "A department-leadership claim with no scope (team size? remit?) and a vapor outcome ('improved customer satisfaction' — no observable). 'Led' is doing work the evidence doesn't back up; every noun is generic.",
    patternText:
      "Led the [department] to focus on [theme] and [theme], delivering [generic outcome] through [generic method].",
    lesson:
      "Leadership claims need scope and a checkable result; 'led X to focus on Y' with no team size and no observable outcome reads as participation dressed as leadership.",
    reviewFlagIds: [],
  },

  // ═══════════════ EMKAN — Lead Software Engineer ═══════════════
  {
    unitId: "u-emk-revamp-2023",
    sourceIds: [...V1, ...V2],
    rawText:
      "Led successful revamp of the Emkan App with advanced tech (Open AI, Figma, React Native, Rive). Developed and designed the app, which resulted in a 150% increase in positive reviews from customers.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["achievement_impact", "language_quality"],
    evaluation:
      "The underlying fact is strong (owned an app revamp; reviews grew measurably — a countable observable). The writing undercuts it: 'successful' and 'advanced tech' are self-graded adjectives and the tech-dump parens return. This is the ORIGINAL, plausible form of the metric that later versions mutated (see flag).",
    patternText:
      "Led the revamp of [product]; developed and designed [scope], resulting in [countable observable, e.g. growth in reviews/downloads].",
    lesson:
      "'Positive reviews grew' is a countable observable — a well-chosen metric. Never let a later edit swap the measured noun for a grander abstract one ('satisfaction').",
    reviewFlagIds: ["flag-satisfaction-150"],
  },
  {
    unitId: "u-emk-portal-2023",
    sourceIds: [...V1, ...V2],
    rawText:
      "Implemented a cutting-edge revamp of the Emkan web merchant portal, using (React, JavaScript, TypeScript, and Figma) which led to customer satisfaction.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["experience_quality", "achievement_impact", "language_quality"],
    evaluation:
      "'Cutting-edge' is decoration; the outcome — 'which led to customer satisfaction' — is the emptiest possible result clause: unfalsifiable, unmeasured, ungrounded. Bullet-quality 1–2 despite a real underlying project.",
    patternText:
      "Implemented a cutting-edge revamp of [product], using ([tech dump]) which led to customer satisfaction.",
    lesson:
      "'Which led to customer satisfaction' is the canonical vapor outcome — it asserts a feeling, not a change. Either state a real observable or end the bullet at the concrete work.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-emk-portal-2026",
    sourceIds: V5,
    rawText:
      "Modernized core merchant platforms by improving user experience and collaborating with backend teams on REST APIs, microservices, and distributed systems supporting PostgreSQL, MySQL, Redis, and Kafka-based integrations, increasing customer satisfaction by 150%.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["achievement_impact", "evidence_specificity"],
    evaluation:
      "Structurally the strongest portal bullet — platform framing, named systems, collaboration surface. But the closing metric is the mutated form ('customer satisfaction by 150%', not the source's 'positive reviews'): an implausible-sounding claim the methodology says to flag, not admire. Acceptable structure; the metric is quarantined by flag-satisfaction-150.",
    patternText:
      "Modernized [platform] by [improvement area] and collaborating with [teams] on [system types] supporting [named infrastructure], [outcome slot — verified metric only].",
    lesson:
      "Platform bullets gain credibility from named infrastructure and collaboration surface; they lose it instantly when the tail metric measures an abstraction (a feeling 'increased by' a triple-digit percentage). Keep the structure, verify the tail.",
    reviewFlagIds: ["flag-satisfaction-150"],
  },
  {
    unitId: "u-emk-arch-2026",
    sourceIds: V5,
    rawText:
      "Led the architecture and development of scalable web and mobile applications using React, React Native, Next.js, and TypeScript, following Clean Architecture principles.",
    quality: "ACCEPTABLE",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["experience_quality", "leadership_ownership"],
    evaluation:
      "Clean lead-level framing (led architecture + development, principles named) but no scope (how many apps? what scale?) and no outcome. A solid opening bullet that needs a companion carrying the result.",
    patternText:
      "Led the architecture and development of [application type] using [technologies], following [architectural approach].",
    lesson:
      "An architecture-ownership bullet establishes altitude; pair it with an outcome bullet — one bullet rarely carries both well.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-emk-push-2023",
    sourceIds: [...V1, ...V2],
    rawText:
      "Redesigned and modernized Emkan app's push notifications with Clevertap, Countly, and Dynatrace for improved engagement by 80%.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["achievement_impact", "language_quality"],
    evaluation:
      "Specific feature area, named tools, measured outcome. Phrasing is awkward ('for improved engagement by 80%' — the preposition mangles the claim) and 'engagement' could name its observable. Facts fine, language costs it.",
    patternText:
      "Redesigned [feature area] with [tools], improving [engagement observable] by [measured amount].",
    lesson:
      "A real metric can still read badly: 'for improved X by N%' is grammatically tangled. Strong bullets put the verb on the outcome — 'improving X by N%'.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-emk-cicd-2026",
    sourceIds: V5,
    rawText:
      "Partnered with Backend and DevOps teams to deliver secure API integrations, CI/CD pipelines, containerized deployments, and cloud-native solutions using Docker.",
    quality: "ACCEPTABLE",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["experience_quality"],
    evaluation:
      "Honest cross-team delivery bullet — 'partnered' is truthful about shared work, deliverables are concrete. No outcome, and four deliverables in one line dilutes each.",
    patternText:
      "Partnered with [teams] to deliver [deliverable 1], [deliverable 2], and [deliverable 3] using [key tool].",
    lesson:
      "'Partnered with' is the honest verb for genuinely shared work — better than inflating to 'led'. Limit the deliverable list so each item stays visible.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-emk-perf-2026",
    sourceIds: V5,
    rawText:
      "Improved application performance, monitoring, observability, accessibility, and engineering standards using Dynatrace and Countly while reducing technical debt and improving release quality.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["experience_quality", "redundancy_noise"],
    evaluation:
      "Seven improvement areas in one sentence — performance, monitoring, observability, accessibility, standards, tech debt, release quality. When one bullet claims everything, the reader believes nothing specifically. No observable for any of the seven.",
    patternText:
      "Improved [area 1], [area 2], [area 3], [area 4], and [area 5] using [tools] while [area 6] and [area 7].",
    lesson:
      "The everything-bullet: past ~three claims, each additional area subtracts credibility. Split into per-area bullets with one observable each, or pick the strongest and cut the rest.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-emk-java-150",
    sourceIds: [...V3, ...V4],
    rawText:
      "Re-engineered core digital platforms using Java and TypeScript, implementing AI-driven IT integrations that increased customer satisfaction by 150%.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["evidence_specificity", "achievement_impact"],
    evaluation:
      "'AI-driven IT integrations' is triple-abstracted jargon naming nothing buildable, and the tail carries the mutated satisfaction-by-150% claim. Compare u-emk-revamp-2023, where the same underlying work is described with a real product and a countable metric.",
    patternText:
      "Re-engineered [vague platforms] using [languages], implementing [buzzword]-driven [abstraction] that increased [abstract feeling] by [suspicious %].",
    lesson:
      "Jargon stacks ('AI-driven IT integrations') plus an abstract percentage is the shape of an inflated bullet. The fix is always the same: name the actual thing built and the actual thing counted.",
    reviewFlagIds: ["flag-satisfaction-150"],
  },
  {
    unitId: "u-emk-k8s",
    sourceIds: [...V3, ...V4],
    rawText:
      "Orchestrated the deployment of merchant portals and app services on Kubernetes, ensuring high availability and seamless scaling in line with SAMA frameworks.",
    quality: "ACCEPTABLE",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    evaluation:
      "Concrete deployment work with a regulatory constraint named — the constraint is substantive evidence in a banking context (per the banking industry pattern). 'Seamless' is filler; 'ensuring high availability' asserts rather than shows.",
    patternText:
      "Deployed [systems] on [platform], meeting [named regulatory/operational constraint].",
    lesson:
      "In regulated industries, naming the compliance framework is real evidence, not filler — regulatory constraints are substantive context (banking-industry pattern).",
    reviewFlagIds: [],
  },

  // ═══════════════ MONSHAAT — Engineering Leader/Manager ═══════════════
  {
    unitId: "u-mon-innovation-2026",
    sourceIds: V5,
    rawText:
      "Lead engineering efforts for startups and digital innovation initiatives, turning early-stage ideas into production-ready web and mobile products with a strong focus on scalability, maintainability, and product quality.",
    quality: "STRONG",
    contentType: "leadership",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["leadership_ownership", "seniority_alignment", "experience_quality"],
    evaluation:
      "Manager-altitude remit statement: what the role transforms (ideas → production products), for whom, judged by what. No metric and none owed — this is a scope-setting bullet. Register matches the claimed level exactly.",
    patternText:
      "Lead [function] for [portfolio/beneficiary], turning [input state] into [output state] with a focus on [quality criteria].",
    lesson:
      "A manager role should open with a remit bullet: the transformation owned ('turning X into Y') at portfolio altitude — before any individual project detail.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mon-direction-2026",
    sourceIds: V5,
    rawText:
      "Define technical direction, engineering standards, and delivery plans while working closely with Product, Design, Backend, QA, and DevOps teams to deliver secure, high-performing solutions.",
    quality: "STRONG",
    contentType: "leadership",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["leadership_ownership"],
    evaluation:
      "The three things a manager owns (direction, standards, delivery plans) plus the full stakeholder surface — precisely the manager-seniority expectations from the seniority model, stated without inflation.",
    patternText:
      "Define [direction artifact], [standards artifact], and [planning artifact] while working with [stakeholder functions] to deliver [outcome quality].",
    lesson:
      "Manager leadership is legible as owned artifacts — direction, standards, plans — plus the stakeholder surface they cross. No adjectives required.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mon-arch-review-2026",
    sourceIds: V5,
    rawText:
      "Review system architecture, microservices designs, REST API integrations, event-driven workflows, and cloud deployment strategies, collaborating with engineering teams on solutions leveraging PostgreSQL, Redis, Kafka, and Kubernetes.",
    quality: "ACCEPTABLE",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["experience_quality", "seniority_alignment"],
    evaluation:
      "Shows the manager stays technically credible (reviews, not builds — correct altitude). List-heavy: five review areas + four technologies in one sentence approaches the everything-bullet.",
    patternText:
      "Review [architecture areas] , collaborating with [teams] on solutions using [core stack].",
    lesson:
      "At manager level, 'review' and 'guide' are the honest technical verbs — claiming hands-on building at this altitude would misalign seniority. Keep the list short.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mon-strapi-60",
    sourceIds: V2,
    rawText:
      "Integrated Strapi CMS and NocoDB for streamlined internal operations, reducing manual data handling by 60% and enabling scalable, low-code content management.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["achievement_impact"],
    evaluation:
      "Tool + purpose + measured reduction is a good shape; but the same claim appears elsewhere as 80% (flag-strapi-60-vs-80), so neither number may be taught or reused until the operator confirms which is real.",
    patternText:
      "Integrated [tools] for [operational purpose], reducing [manual process] by [verified amount] and enabling [capability].",
    lesson:
      "Automation bullets are strongest as tool + purpose + measured reduction — but a metric that varies across your own document versions is a metric you don't actually have yet.",
    reviewFlagIds: ["flag-strapi-60-vs-80"],
  },
  {
    unitId: "u-mon-strapi-80",
    sourceIds: [...V3, ...V4],
    rawText:
      "Defined and implemented engineering standards using Strapi and NocoDB, reducing manual data handling by 80% through automated IT integration and lifecycle management.",
    quality: "ACCEPTABLE",
    contentType: "achievement",
    contentClass: ["OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["achievement_impact", "evidence_specificity"],
    evaluation:
      "Same underlying work as u-mon-strapi-60 with a different figure (80% vs 60%) and a vaguer mechanism ('automated IT integration'). The conflict is the finding; no pattern is extracted from this variant to avoid teaching either number.",
    patternText: null,
    lesson: null,
    reviewFlagIds: ["flag-strapi-60-vs-80"],
  },
  {
    unitId: "u-mon-metabase",
    sourceIds: [...V2, ...V3, ...V4],
    rawText:
      "Established a Unified Data Dictionary and real-time analytics via Metabase to ensure data integrity and architectural consistency across the organization.",
    quality: "ACCEPTABLE",
    contentType: "project",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    evaluation:
      "Two named, concrete artifacts (a data dictionary, an analytics layer) with an organizational purpose — good internal-system shape. 'Ensure integrity/consistency' asserts the goal rather than an observed change.",
    patternText:
      "Established [named internal artifact] and [capability] via [tool] to [organizational purpose].",
    lesson:
      "Internal-systems work becomes credible when the artifact has a name and an organizational customer; the outcome can be a purpose when no honest measurement exists.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mon-compliance",
    sourceIds: [...V2, ...V3, ...V4],
    rawText:
      "Partner with cross-functional stakeholders to align technical roadmaps with business goals while ensuring 100% regulatory compliance.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["evidence_specificity", "language_quality"],
    evaluation:
      "Three abstractions chained ('stakeholders', 'roadmaps', 'business goals') with zero nouns a reader could probe, capped by '100% regulatory compliance' — an absolute with no audit behind it. Sounds executive, says nothing.",
    patternText:
      "Partner with [generic stakeholders] to align [generic artifact] with [generic goals] while ensuring 100% [absolute claim].",
    lesson:
      "Fake executive tone: chained abstractions plus an absolute percentage. Real strategic bullets survive the question 'which stakeholders, which decision, what happened?'",
    reviewFlagIds: ["flag-compliance-100"],
  },
  {
    unitId: "u-mon-revamp-2024",
    sourceIds: V2,
    rawText:
      "Led the end-to-end revamp of Monshaat's digital platforms, using React Native, Next.js, and Figma to elevate user experience and performance across web and mobile.",
    quality: "ACCEPTABLE",
    contentType: "project",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["experience_quality", "leadership_ownership"],
    evaluation:
      "End-to-end ownership of a platform revamp with concrete stack. 'Elevate user experience and performance' is asserted, not evidenced; at manager level the bullet also under-plays the team dimension (who did the person lead?).",
    patternText:
      "Led the end-to-end revamp of [platform scope], using [technologies] to [improvement purpose] across [surfaces].",
    lesson:
      "'End-to-end' earns its place when the scope is named. At manager level, add the team dimension — a revamp bullet without people led reads as an IC bullet.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mon-sprints-2024",
    sourceIds: V2,
    rawText:
      "Led cross-functional sprints to deliver the Innovation Center website, aligning development with strategic goals and improving delivery efficiency through Agile practices.",
    quality: "ACCEPTABLE",
    contentType: "project",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    dimensionIds: ["experience_quality", "seniority_alignment"],
    evaluation:
      "Concrete deliverable (a named website shipped) but the framing is activity-level (sprints, ceremonies) for a manager document — process vocabulary carrying weight that outcomes should carry. Superseded in v5 by the remit-level u-mon-innovation-2026.",
    patternText:
      "Led [process ceremonies] to deliver [deliverable], aligning development with [goals] and improving [process quality] through [methodology].",
    lesson:
      "Process vocabulary (sprints, Agile, ceremonies) describes how you worked, not what changed. As seniority rises, the same work should be re-framed from activities to remit.",
    reviewFlagIds: [],
  },

  // ═══════════ MUNASEB / TUWAIQPAY — part-time leadership ═══════════
  {
    unitId: "u-mun-team",
    sourceIds: V2,
    rawText:
      "Led a cross-functional engineering team to deliver Munaseb's fintech platform, overseeing frontend, backend, and service integrations.",
    quality: "STRONG",
    contentType: "leadership",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["leadership_ownership", "experience_quality"],
    evaluation:
      "Team + deliverable + technical scope in one clean line: led whom, to ship what, across which layers. The manager-bullet skeleton with no wasted words.",
    patternText:
      "Led a cross-functional engineering team to deliver [product], overseeing [layer 1], [layer 2], and [layer 3].",
    lesson:
      "LEADERSHIP + TEAM + DELIVERY + SCOPE: the minimal complete manager bullet — who was led, what shipped, what surface was overseen.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mun-integrations",
    sourceIds: V2,
    rawText:
      "Architected and launched a secure, regulation-compliant system integrated with Simah, Nafath, and Yaqeen.",
    quality: "STRONG",
    contentType: "technical",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["evidence_specificity", "experience_quality"],
    evaluation:
      "Short and dense: two ownership verbs (architected AND launched — design through delivery), a real constraint (regulation-compliant), and three named external integrations any fintech reader can verify the difficulty of. High evidence texture, no metric needed.",
    patternText:
      "Architected and launched a [constraint-bearing] system integrated with [named external system 1], [2], and [3].",
    lesson:
      "Named third-party integrations are self-authenticating evidence — a reader who knows the domain knows exactly what integrating them takes. Verb pairs like 'architected and launched' compactly claim design-through-delivery.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-mun-mvp",
    sourceIds: V2,
    rawText:
      "Collaborated closely with founders and stakeholders to shape product direction and deliver a successful MVP.",
    quality: "ACCEPTABLE",
    contentType: "project",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["experience_quality"],
    evaluation:
      "Founder-facing influence is a real startup-context signal; 'shape product direction' and 'successful MVP' are soft ('successful' self-graded). Delivery fact is real (the MVP shipped).",
    patternText:
      "Worked directly with [founders/decision-makers] to shape [product decisions] and deliver [milestone].",
    lesson:
      "In startup contexts, proximity to founders and shipped milestones are the relevant scope signals — but let the milestone speak; 'successful' is the reader's judgment to make.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-twq-team",
    sourceIds: V2,
    rawText:
      "Leading a remote-first team to build merchant onboarding systems and internal dashboards using React, Next.js, and GitLab CI/CD.",
    quality: "ACCEPTABLE",
    contentType: "leadership",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["leadership_ownership", "experience_quality"],
    evaluation:
      "Team mode (remote-first) + concrete systems + stack. No team size, no outcome yet (role listed as Present) — acceptable for an in-progress engagement.",
    patternText:
      "Leading a [team mode] team to build [system 1] and [system 2] using [stack].",
    lesson:
      "Working-mode context ('remote-first') is legitimate scope information — it tells the reader what kind of leadership was required.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-twq-standups",
    sourceIds: V2,
    rawText:
      "Implemented structured workflows, including Slack-based standups to improve team coordination and delivery speed.",
    quality: "WEAK",
    contentType: "bullet",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "engineering_leadership",
    industry: "fintech",
    dimensionIds: ["content_prioritization", "seniority_alignment"],
    evaluation:
      "Running standups is table stakes, not an achievement — task-level minutiae on a leadership document. Space this line occupies is space the role's real outcomes don't get.",
    patternText:
      "Implemented [routine process ceremony] to improve [generic team quality].",
    lesson:
      "If a bullet describes something every competent holder of the role does by default (standups, code reviews existing at all), it is prioritization noise — cut it and spend the line on an outcome.",
    reviewFlagIds: [],
  },

  // ═══════════════ COMPETENCIES / AWARDS / EDUCATION ═══════════════
  {
    unitId: "u-comp-mentoring",
    sourceIds: V3,
    rawText:
      "Leadership & People Development: Mentoring 20+ engineers, 1:1 coaching, performance reviews, and talent retention.",
    quality: "STRONG",
    contentType: "leadership",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "technology",
    dimensionIds: ["leadership_ownership", "evidence_specificity"],
    evaluation:
      "People-leadership with explicit scope (a stated mentee count) and the concrete mechanisms (1:1s, reviews, retention). The one competency line in all five versions that quantifies people scope.",
    patternText:
      "People development: mentoring [N]+ engineers through [mechanism 1], [mechanism 2], and [mechanism 3].",
    lesson:
      "People-leadership claims become checkable the moment head-count scope and the actual mechanisms are stated — 'mentoring N engineers via 1:1s and reviews' beats any amount of 'passionate about growing teams'.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-comp-openai-2023",
    sourceIds: V1,
    rawText:
      "Open AI. Integrating and developing OpenAI's API into the emkan app to enhance the applying product process and improve customer experience journeys.",
    quality: "WEAK",
    contentType: "technical",
    contentClass: ["LANGUAGE_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    dimensionIds: ["language_quality", "evidence_specificity"],
    evaluation:
      "Real, differentiating work (an LLM API integration in production fintech, early) buried under broken phrasing — 'the applying product process' and 'experience journeys' force rereading. A strong fact defeated by language quality.",
    patternText:
      "Integrated [notable API/technology] into [product] to [garbled purpose clause].",
    lesson:
      "A genuinely differentiating fact can be sunk purely by sentence mechanics — language-quality findings matter most on the bullets that matter most.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-award-waed",
    sourceIds: [...V1, ...V2, ...V3, ...V4, ...V5],
    rawText: "1st Place: Aramco's Wa'ed Programming Competition (100k Award). Nov 2018",
    quality: "ACCEPTABLE",
    contentType: "award",
    contentClass: ["STRUCTURAL_PATTERN", "OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "entry",
    roleFamily: "any",
    industry: "technology",
    dimensionIds: ["evidence_specificity", "content_prioritization"],
    evaluation:
      "Model award line: rank + named competition + prize scale + date. All five versions keep it — correctly, since a national first place stays load-bearing. (The operator's specific awards are facts, never reusable content.)",
    patternText: "[Rank]: [Named competition/issuer] ([prize or scale]). [Date]",
    lesson:
      "Award lines carry weight through rank + issuer + scale + date. Undated, unranked award mentions ('won multiple awards') spend the same space for a fraction of the credibility.",
    reviewFlagIds: [],
  },
  {
    unitId: "u-edu-degree",
    sourceIds: [...V1, ...V2, ...V3, ...V4, ...V5],
    rawText:
      "B.A. Degree - Advanced Knowledge of Algorithms and Problem Solving. Earned a B.A. Degree in Computer Science from King Faisal University, with honors by the college's Dean for my participation and achievements in winning multiple programming competitions.",
    quality: "ACCEPTABLE",
    contentType: "career_progression",
    contentClass: ["OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "entry",
    roleFamily: "any",
    industry: "technology",
    dimensionIds: ["content_prioritization"],
    evaluation:
      "Degree + distinction + the reason for the distinction. Wordy ('with honors by the college's Dean for my participation and achievements in winning') and, on a 9-year manager CV, education detail at this length is a prioritization question. Kept as fact; no reusable pattern extracted beyond what the prioritization rubric already teaches.",
    patternText: null,
    lesson: null,
    reviewFlagIds: [],
  },
  {
    unitId: "u-sum-breadth-2023",
    sourceIds: V1,
    rawText:
      "…enhancing quality by 95% and driving substantial profitability across various development domains.",
    quality: "DO_NOT_REUSE",
    contentType: "bullet",
    contentClass: ["OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "lead",
    roleFamily: "engineering_leadership",
    industry: "technology",
    dimensionIds: ["evidence_specificity"],
    evaluation:
      "Unverifiable percentage + unmeasurable claim ('substantial profitability') + maximal vagueness ('various development domains'). Nothing here is a fact, a pattern, or even a clean anti-pattern beyond what ap-unverifiable-metric already teaches. Excluded entirely.",
    patternText: null,
    lesson: null,
    reviewFlagIds: ["flag-quality-95"],
  },
  {
    unitId: "u-comp-swiftui-2024",
    sourceIds: V2,
    rawText:
      "Swift UI & React native … Proficient in React Native and Figma, with expertise in designing adaptive, interactive, and scalable user interfaces across Apple platforms.",
    quality: "DO_NOT_REUSE",
    contentType: "bullet",
    contentClass: ["OPERATOR_SPECIFIC_FACT"],
    language: "en",
    seniority: "manager",
    roleFamily: "software_engineering",
    industry: "technology",
    dimensionIds: ["skills_relevance"],
    evaluation:
      "Headline names SwiftUI, body demonstrates only React Native/Figma — a skills-relevance mismatch (skill claimed, never evidenced anywhere in any version). Too context-dependent and unsupported to reuse in any direction.",
    patternText: null,
    lesson: null,
    reviewFlagIds: [],
  },
];

/** Units by quality, for the report and the seed. */
export function unitsByQuality(quality: CvContentUnit["quality"]): CvContentUnit[] {
  return CV_CONTENT_UNITS.filter((u) => u.quality === quality);
}
