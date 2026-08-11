/**
 * Command 04 §5–§6 — genuine before → after pairs across CV versions.
 *
 * Rules enforced here (and asserted by the harness):
 *  - both sides ANONYMIZED: no operator company/product names, no operator
 *    metrics — placeholders mark where the user's own facts go (§8);
 *  - a pair exists only where a later CV version genuinely rewrote an
 *    earlier version's content (§5) — no manufactured pairs;
 *  - an "after" may never contain a number/fact absent from the sources
 *    (§6); where a number would help, the pair's classification is
 *    NEEDS_USER_CONFIRMATION and the improvement is structural only.
 */
import type { BeforeAfterPair } from "./types.ts";

export const BEFORE_AFTER_PAIRS: BeforeAfterPair[] = [
  {
    pairId: "ba-app-bullet-ownership",
    beforeUnitId: "u-arj-impl-2023",
    afterUnitId: "u-arj-led-2026",
    before:
      "Implemented and designed the mobile app with extensive knowledge of ([technology list]) resulting in a seamless user experience and [N]% positive user feedback.",
    after:
      "Led the development of [the product] using [core technologies], contributing to [verified user-feedback result] and [verified growth result].",
    whyImproved:
      "Self-praise ('with extensive knowledge of') became an ownership verb; the parenthesized tech dump moved inside the action; the filler adjective ('seamless') was replaced by the second verified outcome the earlier version already possessed but didn't use. Every fact in the after exists in the source; nothing was added.",
    dimensionIds: ["experience_quality", "achievement_impact", "language_quality"],
    factPreservationClassification: "SAFE_TO_REWRITE",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    language: "en",
  },
  {
    pairId: "ba-summary-identity",
    beforeUnitId: "u-sum-2023",
    afterUnitId: "u-sum-2026",
    before:
      "[Title] with over [N] years of a broad set of skills applicable across different sectors and roles, crafting innovative solutions for top companies… Seeking to leverage my expertise to enhance business operations.",
    after:
      "[Title] with [N]+ years leading [team type] in [domain], delivering [platform type] across [sectors]. Experienced in [2–3 technical areas]. Strong background [collaboration surface] while [leadership signal].",
    whyImproved:
      "The generic breadth claim ('broad set of skills', 'different sectors') became one specific identity with named domains and sectors; the buzzword verbs and the 'seeking' objective disappeared; the unverifiable percentage was dropped rather than replaced. Positioning went from 'anyone' to 'this person'.",
    dimensionIds: ["professional_summary", "positioning", "evidence_specificity"],
    factPreservationClassification: "SAFE_TO_REWRITE",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "technology",
    language: "en",
  },
  {
    pairId: "ba-integration-mechanism",
    beforeUnitId: "u-arj-sarie-2023",
    afterUnitId: "u-arj-middleware",
    before:
      "Managed core banking system integrations with the retail app to streamline financial operations ([named national payment system]).",
    after:
      "Optimized core banking integrations by developing [language]-based middleware to interface with [named national payment system] for streamlined financial operations.",
    whyImproved:
      "'Managed integrations' hid the person's actual contribution; the rewrite names the mechanism they built (middleware, in a named language) while keeping the named external system and the purpose. No metric added — the bullet reaches quality 4 on mechanism specificity alone.",
    dimensionIds: ["experience_quality", "evidence_specificity"],
    factPreservationClassification: "SAFE_TO_REWRITE",
    seniority: "senior",
    roleFamily: "software_engineering",
    industry: "banking",
    language: "en",
  },
  {
    pairId: "ba-portal-structure-not-metric",
    beforeUnitId: "u-emk-portal-2023",
    afterUnitId: "u-emk-portal-2026",
    before:
      "Implemented a cutting-edge revamp of [the product], using ([technology list]) which led to customer satisfaction.",
    after:
      "Modernized [the platform] by improving user experience and collaborating with backend teams on [system types] supporting [named infrastructure], [outcome — pending verification].",
    whyImproved:
      "STRUCTURALLY better: 'cutting-edge' dropped, platform context and named infrastructure added, collaboration surface stated. BUT the source versions' outcome mutated between edits (a countable observable became an abstract feeling with the same percentage), so the outcome slot ships empty pending the operator's answer to the metric-mutation question. A rewrite may improve structure while the fact underneath still needs confirmation.",
    dimensionIds: ["experience_quality", "achievement_impact", "evidence_specificity"],
    factPreservationClassification: "NEEDS_USER_CONFIRMATION",
    seniority: "lead",
    roleFamily: "software_engineering",
    industry: "fintech",
    language: "en",
  },
  {
    pairId: "ba-manager-altitude",
    beforeUnitId: "u-mon-sprints-2024",
    afterUnitId: "u-mon-innovation-2026",
    before:
      "Led cross-functional sprints to deliver [the website], aligning development with strategic goals and improving delivery efficiency through Agile practices.",
    after:
      "Lead [function] for [portfolio/beneficiary], turning early-stage ideas into production-ready products with a focus on [quality criteria].",
    whyImproved:
      "The same role rewritten one altitude up: process ceremonies (sprints, Agile) became the remit they served (a portfolio transformed from ideas to shipped products). Nothing was invented — the later version simply describes the job at the level the title claims. The canonical seniority-alignment rewrite.",
    dimensionIds: ["seniority_alignment", "leadership_ownership", "experience_quality"],
    factPreservationClassification: "SAFE_TO_REWRITE",
    seniority: "manager",
    roleFamily: "engineering_leadership",
    industry: "government",
    language: "en",
  },
];
