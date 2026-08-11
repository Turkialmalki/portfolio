/**
 * THE 15 DIMENSION RUBRICS (Command 03 §2, §5, §11–§20).
 *
 * This file IS the methodology: every score the engine ever produces must
 * trace back to a rubric here — defined criteria, observable signals,
 * explicit anchors — never to "the AI thinks this is 73". The LLM's job
 * is to match a CV against these signals and quote evidence; the weights
 * and the arithmetic belong to scoring.ts.
 *
 * Weights sum to exactly 100 (asserted by the harness). They are NOT
 * equal on purpose:
 *   - Experience quality + achievement/impact (24 combined) carry the
 *     most because the experience section is what a reviewer actually
 *     reads and what a hiring decision leans on.
 *   - Evidence/specificity (10) is deliberately heavy so that polished
 *     but hollow writing cannot score like a strong CV (§33 sanity
 *     check: excellent prose + zero evidence must not reach 95 — see
 *     also the cap in scoring.ts).
 *   - Redundancy (2) and content prioritization (4) are real but
 *     secondary: they shape the reading experience, they rarely sink it.
 *   - Contextual dimensions (target role 7, keywords 5) are meaningful
 *     when context exists and are cleanly reweighted away when it
 *     doesn't (§3, scoring.ts).
 */
import type { DimensionId, SeniorityLevel } from "./types.ts";
import { SENIORITY_LEVELS } from "./types.ts";

export interface ScoreAnchor {
  /** Anchor applies when the dimension score is at or above this value. */
  atOrAbove: number;
  description: string;
}

export interface RecommendationRule {
  /** Which observed signal triggers this recommendation. */
  when: string;
  recommend: string;
}

export interface DimensionRubric {
  id: DimensionId;
  titleAr: string;
  titleEn: string;
  purpose: string;
  /** Percentage points of the overall score, before reweighting. */
  weight: number;
  whatGoodLooksLike: string;
  positiveSignals: string[];
  warningSignals: string[];
  majorProblems: string[];
  evaluationQuestions: string[];
  scoreAnchors: ScoreAnchor[];
  recommendationRules: RecommendationRule[];
  applicableSeniority: SeniorityLevel[];
  requiresTargetRole: boolean;
  requiresJobDescription: boolean;
}

const ALL: SeniorityLevel[] = [...SENIORITY_LEVELS];

/**
 * §12: bullet-quality subscore, 0–5. A 5 does NOT require a number —
 * strong ownership + outcome + credible scope is enough. Never
 * incentivize inventing metrics to climb this scale.
 */
export const BULLET_QUALITY_SCALE = [
  { level: 0, meaning: "Meaningless or fully generic — could appear in any CV unchanged." },
  { level: 1, meaning: "Task only — names an activity with no ownership, context, or result." },
  { level: 2, meaning: "Clear responsibility — what the person was accountable for is legible." },
  { level: 3, meaning: "Ownership plus useful context — scope, team, product, or constraint is visible." },
  { level: 4, meaning: "Ownership plus outcome — states what changed because of the work." },
  { level: 5, meaning: "Strong ownership + outcome + credible evidence or scope. A number helps but is NOT required." },
] as const;

export const DIMENSIONS: readonly DimensionRubric[] = [
  {
    id: "positioning",
    titleAr: "التموضع المهني",
    titleEn: "Positioning",
    purpose:
      "Whether the CV, read top to bottom, projects one coherent professional identity a reader could describe in a sentence.",
    weight: 8,
    whatGoodLooksLike:
      "Within the first half page a reader knows what this person is, at what level, in what domain — and the rest of the document keeps agreeing with that claim.",
    positiveSignals: [
      "headline/summary, recent roles, and skills all point at the same profession and level",
      "a clear specialization or domain rather than 'everything'",
      "recent, relevant work is what the document leads with",
    ],
    warningSignals: [
      "headline says one profession, experience says another, skills say a third",
      "identity only becomes clear after reading the whole document",
      "positioned simultaneously for several unrelated roles",
    ],
    majorProblems: [
      "no discernible professional identity at all",
      "positioning actively contradicts the experience section",
    ],
    evaluationQuestions: [
      "After the first half page, can you state who this is professionally in one sentence?",
      "Do headline, experience, and skills tell the same story?",
      "Is the claimed level consistent with the evidence presented?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Identity is instant, specific, and every section reinforces it." },
      { atOrAbove: 75, description: "Clear identity with minor drift (an off-topic skill block or stale headline)." },
      { atOrAbove: 60, description: "Identity emerges but the reader assembles it themselves." },
      { atOrAbove: 45, description: "Conflicting signals; level or profession is genuinely ambiguous." },
      { atOrAbove: 0, description: "No coherent identity; the document reads as a list of unrelated facts." },
    ],
    recommendationRules: [
      {
        when: "headline and experience disagree",
        recommend: "Rewrite the headline to name the role the experience actually supports.",
      },
      {
        when: "positioned for multiple unrelated roles",
        recommend: "Choose the primary target and move the rest to a secondary line or drop it.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "professional_summary",
    titleAr: "الملخص المهني",
    titleEn: "Professional Summary",
    purpose:
      "Whether the opening summary earns its space: identity, seniority, domain, and distinctive value in a few tight lines (§11).",
    weight: 6,
    whatGoodLooksLike:
      "Two to four lines naming the profession, level, domain/specialization, and one distinctive, evidence-backed claim — no filler.",
    positiveSignals: [
      "names a concrete professional identity and seniority",
      "states domain or specialization",
      "contains at least one specific, checkable claim",
      "short enough to read in one breath",
    ],
    warningSignals: [
      "opens with 'highly motivated', 'results-driven', 'seeking a challenging opportunity' or equivalents",
      "adjectives without a single fact",
      "long paragraph restating the experience section",
      "third-person self-praise",
    ],
    majorProblems: [
      "a generic objective paragraph that could belong to anyone",
      "summary contradicts the experience below it",
    ],
    evaluationQuestions: [
      "Could this exact summary sit on a stranger's CV without edits? (If yes, it is generic.)",
      "Does it contain one claim you could verify from the experience section?",
      "Does it name role + level + domain?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Specific, brief, evidence-backed; reads like this person and no one else." },
      { atOrAbove: 75, description: "Clear identity, one or two generic phrases dilute it." },
      { atOrAbove: 60, description: "Present and roughly accurate but interchangeable in places." },
      { atOrAbove: 45, description: "Mostly buzzwords; identity vague." },
      { atOrAbove: 0, description: "Pure boilerplate objective, or absent where the document needs one." },
    ],
    recommendationRules: [
      {
        when: "generic-language detection fires (see detection list in this rubric's warning signals)",
        recommend: "Replace each buzzword with one fact from the experience section that proves the same point.",
      },
      {
        when: "summary exceeds ~5 lines",
        recommend: "Cut to the strongest identity claim plus one distinctive proof point.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "experience_quality",
    titleAr: "جودة الخبرات",
    titleEn: "Experience Quality",
    purpose:
      "The craft of the experience section itself: are bullets owned, contextualized, specific, relevant, and non-duplicated (§12)?",
    weight: 12,
    whatGoodLooksLike:
      "Each role opens with its scope, then a handful of bullets that each score 3+ on the bullet-quality scale: ownership, context, and — where true — outcome.",
    positiveSignals: [
      "bullets start with strong ownership verbs",
      "scope is stated (team size, product, system, market) where it exists",
      "each bullet says something the others don't",
      "recent roles are the most developed",
    ],
    warningSignals: [
      "'responsible for', 'worked on', 'participated in' as the dominant pattern",
      "duty lists copied from a job description",
      "identical bullets across different roles",
      "old roles described in as much detail as current ones",
    ],
    majorProblems: [
      "experience section is a wall of undifferentiated tasks",
      "roles listed with no content at all",
    ],
    evaluationQuestions: [
      "Score each bullet 0–5 on the bullet-quality scale; what is the median?",
      "Does any bullet explain what the person owned rather than attended?",
      "Do bullets within one role repeat each other?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Median bullet quality 4+; scope visible; zero duplication." },
      { atOrAbove: 75, description: "Median 3; ownership clear, outcomes present in the key roles." },
      { atOrAbove: 60, description: "Median 2; responsibilities legible but little ownership or context." },
      { atOrAbove: 45, description: "Median 1; predominantly task lists." },
      { atOrAbove: 0, description: "Median 0–1 with heavy duplication or near-empty roles." },
    ],
    recommendationRules: [
      {
        when: "a bullet scores 1–2 and the underlying work plausibly had an outcome",
        recommend: "Ask the missing-evidence question for that bullet rather than inventing a result (§7).",
      },
      {
        when: "duplicate bullets across roles",
        recommend: "Keep the strongest instance where it had the most scope; cut or differentiate the rest.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "achievement_impact",
    titleAr: "الإنجاز والأثر",
    titleEn: "Achievement / Impact",
    purpose:
      "Does the experience explain what CHANGED because of the candidate's work, rather than only listing responsibilities?",
    weight: 12,
    whatGoodLooksLike:
      "Key bullets connect an owned action to a real outcome — delivery, improvement, business/product/customer effect — with verified numbers where they truly exist, and honest factual statements where they don't.",
    positiveSignals: [
      "verbs showing ownership",
      "clear outcome stated",
      "scope of the work visible",
      "improvement or delivery named",
      "business, product, or customer impact",
      "verified metrics where available",
    ],
    warningSignals: [
      "'responsible for'",
      "'worked on'",
      "task lists",
      "generic duties",
      "no result anywhere in a role",
      "no scope anywhere in a role",
    ],
    majorProblems: [
      "not a single outcome in the entire document",
      "suspiciously uniform or implausible metrics (flag for confirmation, never 'fix')",
    ],
    evaluationQuestions: [
      "For each key role: what changed because this person was there?",
      "Are outcomes attributed to owned work, or to the team/company in general?",
      "IMPORTANT: metrics are useful but NOT mandatory — does a metric-free bullet still state a concrete, credible change?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Outcomes throughout, credibly owned; metrics only where they are real." },
      { atOrAbove: 75, description: "Clear outcomes in the roles that matter; some bullets remain duty-only." },
      { atOrAbove: 60, description: "Occasional outcomes, mostly responsibilities." },
      { atOrAbove: 45, description: "Almost entirely responsibilities without results." },
      { atOrAbove: 0, description: "Pure duty list; no change attributable to the candidate anywhere." },
    ],
    recommendationRules: [
      {
        when: "a role has zero outcomes",
        recommend: "Generate missingEvidenceQuestions for that role's strongest bullets — never write a number in (§7).",
      },
      {
        when: "outcomes exist but are buried mid-bullet",
        recommend: "Restructure the bullet so the change leads or lands the sentence (SAFE_TO_REWRITE).",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "career_progression",
    titleAr: "التدرج المهني",
    titleEn: "Career Progression",
    purpose:
      "Whether scope, ownership, and responsibility grow across the timeline — evaluated contextually, without moral judgment (§10).",
    weight: 6,
    whatGoodLooksLike:
      "Later roles visibly carry more scope or ownership than earlier ones, and moves (including changes of field, gaps, contracts, freelancing) read as a coherent path when context is given.",
    positiveSignals: [
      "titles or scope grow over time",
      "promotions or expanded remits made explicit",
      "career changes framed with what carried over",
      "consistency between claimed trajectory and role content",
    ],
    warningSignals: [
      "identical scope described across many years",
      "a materially relevant unexplained gap (recent, long, and load-bearing for the target)",
      "trajectory claims ('led', 'headed') not reflected in any role content",
    ],
    majorProblems: [
      "timeline internally contradictory (overlaps/dates that cannot both be true — flag, don't accuse)",
    ],
    evaluationQuestions: [
      "Does scope grow, hold, or shrink across the last three roles?",
      "Do NOT penalize: career changes, employment gaps, short contracts, freelancing — is any finding here contextual rather than a reflex penalty?",
      "Is a gap only flagged when materially relevant to the target role and recent?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Clear compounding trajectory, explicitly narrated." },
      { atOrAbove: 75, description: "Growth visible; the reader infers some of it." },
      { atOrAbove: 60, description: "Flat but coherent; no growth story told." },
      { atOrAbove: 45, description: "Trajectory unclear or claims outrun the evidence." },
      { atOrAbove: 0, description: "Timeline incoherent or contradictory." },
    ],
    recommendationRules: [
      {
        when: "a promotion or scope increase is real but invisible",
        recommend: "Split the role or add a line marking the change in remit (NEEDS_USER_CONFIRMATION for facts).",
      },
      {
        when: "a gap is materially relevant",
        recommend: "Offer a neutral one-line context option; never demand justification.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "leadership_ownership",
    titleAr: "القيادة وتحمّل المسؤولية",
    titleEn: "Leadership / Ownership",
    purpose:
      "Whether the document shows the leadership/ownership its claimed level implies — judged per seniority, never forced onto juniors (§9).",
    weight: 6,
    whatGoodLooksLike:
      "At the document's claimed level, the corresponding expectation is visible: independence and end-to-end ownership (senior), technical direction and cross-team influence (lead), people/delivery/stakeholders (manager), strategy and organizational outcomes (director/executive).",
    positiveSignals: [
      "decisions the person made, not meetings they attended",
      "things owned end-to-end",
      "coaching, hiring, or direction where the level implies it",
      "stakeholders or cross-team surface area named",
    ],
    warningSignals: [
      "a manager-level CV consisting only of individual task descriptions",
      "leadership adjectives with no owned decision anywhere",
      "'led' used for participation",
    ],
    majorProblems: [
      "claimed people/organizational leadership with zero supporting content at manager level and above",
    ],
    evaluationQuestions: [
      "At this seniority (see seniority.ts guidance), what leadership signal is expected — and is it present?",
      "Is 'leadership' shown as decisions and outcomes, or as vocabulary?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Level-appropriate ownership shown concretely and repeatedly." },
      { atOrAbove: 75, description: "Ownership visible in the main roles; thinner elsewhere." },
      { atOrAbove: 60, description: "Some ownership; mostly execution framing for the claimed level." },
      { atOrAbove: 45, description: "Level implies leadership the document never shows." },
      { atOrAbove: 0, description: "Manager+ document that is entirely tasks (§33 sanity case)." },
    ],
    recommendationRules: [
      {
        when: "manager+ CV shows only tasks",
        recommend: "Surface the highest-severity issue: rewrite key roles around team, delivery, and stakeholder outcomes the person can actually claim (ask, don't invent).",
      },
    ],
    // Excluded for entry-level: execution, learning, and contribution are
    // the expectation there (§9); entry candidates must NOT lose points
    // for not managing people (§33). Reweighting handles the exclusion.
    applicableSeniority: ["mid", "senior", "lead", "manager", "director", "executive"],
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "skills_relevance",
    titleAr: "ملاءمة المهارات",
    titleEn: "Skills Relevance",
    purpose:
      "Whether listed skills are current, coherent with the experience, and demonstrated rather than merely enumerated.",
    weight: 6,
    whatGoodLooksLike:
      "A focused skills set that the experience section actually demonstrates, ordered by relevance, without decade-old or padding entries.",
    positiveSignals: [
      "skills appear inside experience bullets, not only in the list",
      "list is curated, not exhaustive",
      "tools/methods match the claimed domain and level",
    ],
    warningSignals: [
      "huge undifferentiated skills list",
      "skills nothing in the experience supports",
      "obsolete entries diluting current strengths",
      "soft-skill padding ('teamwork, communication') as list items",
    ],
    majorProblems: [
      "skills section contradicts the experience (different profession's toolkit)",
    ],
    evaluationQuestions: [
      "Pick the top five listed skills: does the experience demonstrate each?",
      "Would removing the bottom half of the list lose anything?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Curated, demonstrated, ordered; the list and the experience vouch for each other." },
      { atOrAbove: 75, description: "Mostly demonstrated with some padding." },
      { atOrAbove: 60, description: "Relevant core buried in an undifferentiated list." },
      { atOrAbove: 45, description: "List largely undemonstrated or stale." },
      { atOrAbove: 0, description: "Skills unrelated to the documented experience." },
    ],
    recommendationRules: [
      {
        when: "undemonstrated skills are listed",
        recommend: "Either evidence them in a bullet (if true — ask) or cut them; favor evidence-based inclusion over list growth (§15).",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "ats_readability",
    titleAr: "قابلية القراءة الآلية (ATS)",
    titleEn: "ATS Readability",
    purpose:
      "Parseability and structural clarity indicators — NOT a simulation of any ATS vendor and never a pass/fail promise (§13).",
    weight: 7,
    whatGoodLooksLike:
      "Standard section names, clear heading hierarchy, machine-readable contact block, no information locked inside graphics or complex tables.",
    positiveSignals: [
      "standard section naming (Experience, Education, Skills or Arabic equivalents)",
      "single-column, linear reading order",
      "contact details as text near the top",
      "dates in a consistent, parseable format",
    ],
    warningSignals: [
      "multi-column layouts where reading order matters",
      "skills or contact info inside images/icons",
      "decorative tables carrying real content",
      "non-standard creative section names",
    ],
    majorProblems: [
      "essential content (name, contact, roles) only present in graphics",
      "document structure with no detectable sections",
    ],
    evaluationQuestions: [
      "If styling were stripped, would the text alone carry every fact?",
      "Are sections named what a parser expects?",
      "Phrase every finding as a readability/compatibility indicator — never 'this will pass ATS'.",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Fully linear, standard, text-first structure." },
      { atOrAbove: 75, description: "Minor risks (one decorative table, a nonstandard heading)." },
      { atOrAbove: 60, description: "Several parsing risks but core facts survive as text." },
      { atOrAbove: 45, description: "Structure fights extraction; real content at risk." },
      { atOrAbove: 0, description: "Essential content unrecoverable from text." },
    ],
    recommendationRules: [
      {
        when: "content lives in graphics/tables",
        recommend: "Move the facts into plain text; keep decoration decorative.",
      },
      {
        when: "creative section names",
        recommend: "Rename to standard headings; keep creativity inside the bullets.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "target_role_alignment",
    titleAr: "التوافق مع الدور المستهدف",
    titleEn: "Target Role Alignment",
    purpose:
      "Whether the CV's positioning, experience, and terminology support the stated target role (§14). Scored ONLY when a target role was provided.",
    weight: 7,
    whatGoodLooksLike:
      "The strongest, most recent material speaks the target role's language; transferable experience is framed toward it; the summary claims it explicitly.",
    positiveSignals: [
      "summary names the target role or its family",
      "recent accomplishments map onto the role's core responsibilities",
      "terminology matches how the target role describes itself",
    ],
    warningSignals: [
      "target role stated but the document leads with unrelated work",
      "transferable experience left untranslated into the target's terms",
    ],
    majorProblems: [
      "no documented experience relates to the target role and no bridge is offered",
    ],
    evaluationQuestions: [
      "Would a hiring manager for the target role find their top three needs addressed in the first page?",
      "Classify each major requirement area as strong_match / partial_match / not_demonstrated — remembering not_demonstrated means the CV doesn't SHOW it, not that the candidate lacks it.",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Document reads as written for this role." },
      { atOrAbove: 75, description: "Clear support with some untranslated experience." },
      { atOrAbove: 60, description: "Plausible fit the reader must construct." },
      { atOrAbove: 45, description: "Positioning points elsewhere." },
      { atOrAbove: 0, description: "No visible bridge to the target." },
    ],
    recommendationRules: [
      {
        when: "transferable experience is untranslated",
        recommend: "Reframe the relevant bullets in the target role's vocabulary without changing any fact (SAFE_TO_REWRITE).",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: true,
    requiresJobDescription: false,
  },
  {
    id: "keyword_coverage",
    titleAr: "تغطية الكلمات المفتاحية",
    titleEn: "Keyword Coverage",
    purpose:
      "Whether the CV naturally demonstrates the job description's CORE, SUPPORTING, and OPTIONAL keywords (§15). Scored ONLY when a JD was provided.",
    weight: 5,
    whatGoodLooksLike:
      "Core JD keywords appear inside evidence-bearing bullets — not stuffed into a skills list — and supporting keywords appear where genuinely true.",
    positiveSignals: [
      "core keywords demonstrated in experience bullets",
      "terminology mirrors the JD where the underlying fact matches",
    ],
    warningSignals: [
      "keywords present only in the skills list",
      "keyword stuffing / unnatural repetition",
      "core JD requirements absent from the document entirely",
    ],
    majorProblems: [
      "coverage achieved by stuffing rather than evidence — recommendations must never push toward this",
    ],
    evaluationQuestions: [
      "Extract the JD's required skills, preferred skills, responsibilities, and domain terms; tier them CORE / SUPPORTING / OPTIONAL.",
      "For each CORE keyword: demonstrated in a bullet, listed only, or absent?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Core fully demonstrated, supporting largely demonstrated, all naturally." },
      { atOrAbove: 75, description: "Core mostly covered; some only listed." },
      { atOrAbove: 60, description: "Partial core coverage; much only listed." },
      { atOrAbove: 45, description: "Core requirements largely undocumented." },
      { atOrAbove: 0, description: "Near-zero overlap with the JD's language and requirements." },
    ],
    recommendationRules: [
      {
        when: "a core keyword is true of the candidate but absent",
        recommend: "Add it inside an evidence-bearing bullet (confirm the fact with the user first) — never as bare list padding.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: true,
    requiresJobDescription: true,
  },
  {
    id: "evidence_specificity",
    titleAr: "الأدلة والتحديد",
    titleEn: "Evidence / Specificity",
    purpose:
      "Whether claims across the WHOLE document are concrete and checkable — the anti-hollow-prose dimension (§6, §33).",
    weight: 10,
    whatGoodLooksLike:
      "Named systems, products, scopes, stakeholders, and outcomes; every adjective somewhere backed by a noun; a factual texture that would survive an interview.",
    positiveSignals: [
      "specific nouns: named products, systems, markets, team shapes",
      "claims that could be verified in a reference call",
      "honest precision ('approximately', 'across three markets') over vague inflation",
    ],
    warningSignals: [
      "adjective-heavy, noun-poor sentences",
      "'various projects', 'multiple stakeholders', 'several initiatives'",
      "identical abstraction level everywhere (nothing zoomed in)",
    ],
    majorProblems: [
      "beautifully written document with no checkable fact in it (must not score high overall — see cap in scoring.ts)",
    ],
    evaluationQuestions: [
      "Pick any three claims: could an interviewer probe each with a concrete follow-up, and would the CV's text give them a foothold?",
      "Does specificity require metrics? No — a strong factual statement without a number can still score well here.",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Concrete throughout; the document is dense with checkable facts." },
      { atOrAbove: 75, description: "Key claims specific; connective tissue generic." },
      { atOrAbove: 60, description: "A few concrete anchors in mostly general prose." },
      { atOrAbove: 45, description: "Predominantly vague; specifics rare." },
      { atOrAbove: 0, description: "No checkable content — regardless of how polished the prose is." },
    ],
    recommendationRules: [
      {
        when: "a vague claim plausibly hides a real specific",
        recommend: "Emit a missingEvidenceQuestion asking for the underlying fact (§7) — never sharpen a claim by guessing.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "language_quality",
    titleAr: "جودة اللغة",
    titleEn: "Language Quality",
    purpose:
      "Writing quality judged BY THE CONVENTIONS OF THE CV'S OWN LANGUAGE — Arabic is never scored against English norms (§16–17, language.ts).",
    weight: 6,
    whatGoodLooksLike:
      "English: clear, brief, strong verbs, varied structure, no buzzword crutches. Arabic: professional, natural phrasing a person would write — neither bureaucratic memo language nor slang, and free of awkward literal-from-English constructions.",
    positiveSignals: [
      "verbs carry the sentences",
      "no sentence needs rereading",
      "consistent tense and person",
      "Arabic that reads as originally written in Arabic",
    ],
    warningSignals: [
      "buzzword density ('synergy', 'dynamic', 'passionate')",
      "repeated sentence openers",
      "Arabic: حرفية الترجمة — English structures transliterated into Arabic",
      "Arabic: overly bureaucratic/governmental register",
      "grammar or agreement errors",
    ],
    majorProblems: [
      "errors frequent enough to undermine credibility",
      "register wildly wrong for a professional document in that language",
    ],
    evaluationQuestions: [
      "Which language guidance applies (see language.ts)? Apply ONLY that one.",
      "Read three random bullets aloud: do they sound like a professional wrote them in this language?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Clean, tight, natural professional register throughout." },
      { atOrAbove: 75, description: "Solid with occasional wordiness or a stray buzzword." },
      { atOrAbove: 60, description: "Understandable but repetitive, wordy, or stilted." },
      { atOrAbove: 45, description: "Frequent awkwardness or errors distract from content." },
      { atOrAbove: 0, description: "Language problems obscure the facts themselves." },
    ],
    recommendationRules: [
      {
        when: "buzzwords or weak verbs dominate",
        recommend: "Rewrite with stronger verbs and the facts already present (SAFE_TO_REWRITE — meaning never changes).",
      },
      {
        when: "Arabic reads as translated English",
        recommend: "Rephrase into natural professional Arabic; restructure the sentence, keep every fact.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "content_prioritization",
    titleAr: "ترتيب أولويات المحتوى",
    titleEn: "Content Prioritization",
    purpose:
      "Whether the document spends its space — and the reader's first minute — on what matters most for its goal (§18, §20).",
    weight: 4,
    whatGoodLooksLike:
      "Recent relevant work gets the most space; early/irrelevant material is compressed; education sized to career stage; density judged on information per line, never on an arbitrary page count.",
    positiveSignals: [
      "space allocation tracks relevance and recency",
      "senior CV compresses early career to lines, not pages",
      "high information density — no paragraph exists to fill space",
    ],
    warningSignals: [
      "large objective paragraph up top",
      "old irrelevant roles dominating the document",
      "huge skills lists or certification walls",
      "extensive education detail on a senior candidate",
    ],
    majorProblems: [
      "the document's best material is buried after its weakest",
    ],
    evaluationQuestions: [
      "Where does the reader's first 60 seconds land, and is that the strongest material?",
      "Length: do NOT apply '1 page good / 2 pages bad' — is every included line earning its space for this experience level, region, industry, and role?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Space allocation is itself an argument for the candidate." },
      { atOrAbove: 75, description: "Right emphasis with some low-value passengers." },
      { atOrAbove: 60, description: "Strong material present but not prioritized." },
      { atOrAbove: 45, description: "Space mostly spent on low-relevance content." },
      { atOrAbove: 0, description: "Prioritization inverted — weakest material leads and dominates." },
    ],
    recommendationRules: [
      {
        when: "old roles dominate",
        recommend: "Compress roles older than ~10 years to one or two lines each unless directly load-bearing for the target.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "redundancy_noise",
    titleAr: "التكرار والحشو",
    titleEn: "Redundancy / Noise",
    purpose:
      "Detecting repeated skills, responsibilities, phrases, achievements, and summary concepts that dilute the signal (§19).",
    weight: 2,
    whatGoodLooksLike:
      "Every idea appears once, in its strongest form, in its best location.",
    positiveSignals: [
      "no phrase-level repetition across sections",
      "each achievement claimed exactly once",
    ],
    warningSignals: [
      "the same skill in summary, skills list, and three bullets",
      "an idea repeated in several sections while only one instance carries evidence",
      "filler phrases recurring as connective tissue",
    ],
    majorProblems: [
      "document length substantially inflated by repetition",
    ],
    evaluationQuestions: [
      "For each repeated concept: which single instance carries evidence, and what do the other instances add? (Usually: nothing.)",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "No meaningful repetition." },
      { atOrAbove: 75, description: "Minor echoes between summary and experience." },
      { atOrAbove: 60, description: "Noticeable repetition of skills/claims." },
      { atOrAbove: 45, description: "Repetition materially pads the document." },
      { atOrAbove: 0, description: "The same content recycled throughout." },
    ],
    recommendationRules: [
      {
        when: "a concept appears in multiple sections with evidence in only one",
        recommend: "Keep the evidenced instance; cut the rest — e.g. 'This leadership idea appears in four sections but only one contains specific evidence.'",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
  {
    id: "seniority_alignment",
    titleAr: "التوافق مع مستوى الأقدمية",
    titleEn: "Seniority Alignment",
    purpose:
      "Whether the document's register, content, and emphasis match its claimed level — in BOTH directions: no inflated framing, no underselling (§9).",
    weight: 3,
    whatGoodLooksLike:
      "An entry CV proud of execution and learning; a senior CV showing independence and impact; an executive CV about strategy and organizational outcomes — each sounding like its own level, not costumed as another.",
    positiveSignals: [
      "content emphasis matches the level's expectations (seniority.ts)",
      "no leadership cosplay on junior documents",
      "no task-level minutiae dominating executive documents",
    ],
    warningSignals: [
      "entry CV forced into leadership language",
      "senior CV describing only supervised execution",
      "executive CV listing tools instead of outcomes",
    ],
    majorProblems: [
      "claimed level and documented content belong to different careers",
    ],
    evaluationQuestions: [
      "Read the document blind: what level would you guess? Does it match the claimed one?",
      "Is any mismatch a writing problem (fixable framing) or an evidence problem (ask the user)?",
    ],
    scoreAnchors: [
      { atOrAbove: 90, description: "Register and content are unmistakably the claimed level's." },
      { atOrAbove: 75, description: "Level legible with occasional off-register content." },
      { atOrAbove: 60, description: "Level ambiguous between two adjacent bands." },
      { atOrAbove: 45, description: "Framing consistently under- or over-shoots the level." },
      { atOrAbove: 0, description: "Claimed level unsupported by any content register." },
    ],
    recommendationRules: [
      {
        when: "framing undershoots real scope",
        recommend: "Reframe existing facts at their true altitude (SAFE_TO_REWRITE) — the facts already support it.",
      },
      {
        when: "framing overshoots the evidence",
        recommend: "Lower the framing or ask for the missing evidence; never manufacture support.",
      },
    ],
    applicableSeniority: ALL,
    requiresTargetRole: false,
    requiresJobDescription: false,
  },
] as const;

export function rubricFor(id: DimensionId): DimensionRubric {
  // DIMENSIONS covers every DimensionId (asserted by the harness).
  return DIMENSIONS.find((d) => d.id === id)!;
}
