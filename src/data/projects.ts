export type ProjectData = {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  industry: string;
  year: string;
  duration: string;
  role: string;
  tools: string[];
  accent: string;
  cardBg: string;
  highlightColor: string;
  image?: string;
  visual: "dashboard" | "fintech" | "mobile" | "enterprise" | "network";
  tags: string[];
  overview: string;
  problem: string;
  goal: string;
  researchInsights: { title: string; description: string }[];
  designProcess: {
    wireframes: string;
    userFlows: string;
    iterations: string;
  };
  finalSolution: {
    description: string;
    highlights: string[];
  };
  designDecisions: { title: string; description: string }[];
  outcomes: { metric: string; value: string; description: string }[];
  reflection: string;
  nextSteps: string[];
};

export const PROJECTS: ProjectData[] = [
  {
    slug: "basebox",
    number: "01",
    title: "BaseBox",
    subtitle: "AI SaaS System Template",
    category: "Product Design",
    industry: "AI / SaaS",
    year: "2024",
    duration: "6 months",
    role: "Lead Product Designer",
    tools: ["Figma", "Framer", "React", "Lottie"],
    accent: "#0091FF",
    cardBg: "linear-gradient(148deg, #0A1628 0%, #0D1F3C 55%, #091422 100%)",
    highlightColor: "rgba(0,145,255,0.35)",
    image: "/basebo.jpg",
    visual: "dashboard",
    tags: ["AI", "SaaS", "Design System", "Enterprise"],
    overview:
      "BaseBox is an enterprise-grade AI SaaS boilerplate that provides end-to-end system templates for rapid product innovation — from authentication to deployment pipelines. The goal was to create a design-forward foundation that teams could adopt in days, not months, reducing redundant groundwork across early-stage product teams.",
    problem:
      "Early-stage SaaS teams spend up to 40% of their initial sprint cycles re-building identical foundational systems — auth flows, onboarding, dashboards, billing, and settings. This creates significant time-to-market drag and leaves teams with inconsistent design quality across core product surfaces.",
    goal:
      "Design a cohesive, modular SaaS template system that could be adopted by any team regardless of industry vertical — reducing foundation setup from months to under a week while maintaining design excellence at every touchpoint.",
    researchInsights: [
      {
        title: "Setup Paralysis",
        description:
          "8 out of 10 early-stage startups interviewed reported losing 6–12 weeks on foundational setup before touching core product problems.",
      },
      {
        title: "Design Inconsistency",
        description:
          "Teams using component-less templates produced UI with 3× more visual inconsistencies in the first 3 months compared to teams using design systems.",
      },
      {
        title: "Onboarding Drop-off",
        description:
          "60% of SaaS products lose new users in the first onboarding session due to poorly designed empty states and unclear activation flows.",
      },
    ],
    designProcess: {
      wireframes:
        "Starting with information architecture mapping, I wire-framed all primary surfaces: landing, auth, onboarding, main dashboard, settings, billing, and team management. Each screen was mapped to a user mental model rather than a developer data model.",
      userFlows:
        "Defined 4 core user journeys: new user activation, team invitation, feature discovery, and subscription management. Each flow was optimized for minimum friction, targeting under 3 taps for primary actions.",
      iterations:
        "3 major design iterations based on usability testing with 12 early adopters. Iteration 1 focused on layout hierarchy, Iteration 2 on onboarding clarity, and Iteration 3 on empty state design and progressive disclosure patterns.",
    },
    finalSolution: {
      description:
        "A comprehensive 40+ screen design system with modular components, pre-built user flows, and adaptive dark/light themes. Every surface ships with thoughtful empty states, error handling, and success patterns.",
      highlights: [
        "40+ production-ready screens covering all core SaaS surfaces",
        "Unified design token system with dark/light theme support",
        "Fully annotated Figma file with component variants and usage guidelines",
        "Interactive Framer prototype for stakeholder presentations",
      ],
    },
    designDecisions: [
      {
        title: "Sidebar over Top Navigation",
        description:
          "A persistent left sidebar enables faster feature discovery and scales better as products add features — top navigation collapses under complexity while sidebars remain scannable.",
      },
      {
        title: "Progressive Onboarding over Full Completion",
        description:
          "Rather than gating access behind full profile completion, users enter the product immediately with contextual prompts surfaced inline — reducing activation friction while nudging toward completeness.",
      },
      {
        title: "Token-Based Design System",
        description:
          "Using semantic tokens (--color-surface, --color-primary) instead of hard-coded values means teams can retheme the entire product in hours, not days — critical for white-label use cases.",
      },
    ],
    outcomes: [
      { metric: "Setup Time", value: "−78%", description: "Reduction in onboarding setup time for adopting teams" },
      { metric: "Teams Onboarded", value: "12+", description: "Early-stage teams using BaseBox as their foundation" },
      { metric: "Screens Delivered", value: "40+", description: "Production-ready design screens across all surfaces" },
      { metric: "Satisfaction", value: "4.8/5", description: "Average rating from adopting team leads" },
    ],
    reflection:
      "BaseBox taught me how to design for zero-context users — people who arrive at a product without any prior knowledge. The biggest insight was that great empty states are as important as great filled states. In the next iteration, I would invest more in animation and micro-interaction guidelines to give the template a stronger sense of life from day one.",
    nextSteps: [
      "Design a mobile companion app for team management on the go",
      "Create industry-specific variants (fintech, health, edtech)",
      "Build an interactive component library alongside the Figma system",
    ],
  },
  {
    slug: "munaaseb",
    number: "02",
    title: "Munaaseb",
    subtitle: "Fintech Innovation & Open Banking",
    category: "UX Design",
    industry: "Fintech",
    year: "2024",
    duration: "8 months",
    role: "Senior UX Designer",
    tools: ["Figma", "Protopie", "Confluence", "Maze"],
    accent: "#00C8A0",
    cardBg: "linear-gradient(148deg, #061A15 0%, #0A2820 55%, #071C18 100%)",
    highlightColor: "rgba(0,200,160,0.35)",
    image: "/munasib.png",
    visual: "fintech",
    tags: ["Fintech", "Open Banking", "Mobile App", "MENA"],
    overview:
      "Munaaseb is a Saudi-based fintech platform that uses open banking APIs to deliver intelligent financial product matching — connecting users to the most suitable savings, investment, and credit products from across Saudi banks based on their real financial profile.",
    problem:
      "Saudi consumers face information overload when choosing financial products. With 30+ banks offering hundreds of products, the average user spends 4+ hours researching before making a financial decision — and still frequently ends up with a product that doesn't match their needs.",
    goal:
      "Design a financial discovery experience that feels as effortless as Google Search — where any Saudi user can find, compare, and apply for the right financial product in under 10 minutes, using their real banking data to power personalized recommendations.",
    researchInsights: [
      {
        title: "Trust Barrier",
        description:
          "72% of surveyed users said they would not share banking data with a third party app unless they understood exactly what data was accessed and why.",
      },
      {
        title: "Comparison Paralysis",
        description:
          "Users comparing financial products across 3+ banks abandoned the task 68% of the time due to inconsistent product presentation and terminology.",
      },
      {
        title: "Mobile-First Expectation",
        description:
          "91% of target users in the 25-40 demographic expected a native mobile experience, citing banking apps as their primary financial interface.",
      },
    ],
    designProcess: {
      wireframes:
        "Mapped the full user journey from open banking consent through to product application. Wire-framed the consent flow with a transparency-first approach — every data permission explained in plain Arabic and English.",
      userFlows:
        "Designed 3 primary flows: first-time setup with bank connection, personalized product discovery, and product comparison + application. Each flow was tested with 18 users across Riyadh and Jeddah.",
      iterations:
        "4 rounds of iteration focused primarily on the consent UX (reducing fear and increasing trust) and the recommendation card layout (making financial data scannable rather than overwhelming).",
    },
    finalSolution: {
      description:
        "A bilingual (Arabic/English) mobile-first fintech platform with a permission-transparent open banking consent flow, AI-powered product matching, and a side-by-side comparison tool that normalizes product terminology across all Saudi banks.",
      highlights: [
        "Transparent open banking consent flow with plain-language permission explanations",
        "Personalized recommendation engine surface with match-score visualization",
        "Bilingual RTL/LTR design system built entirely in Figma",
        "Bank product comparison tool with normalized terminology",
      ],
    },
    designDecisions: [
      {
        title: "Consent-First Architecture",
        description:
          "Making bank data permissions explicit and granular (not bundled) directly addressed the primary trust barrier — users who saw itemized permissions converted at 2.4× the rate of those shown a generic 'allow access' prompt.",
      },
      {
        title: "Match Score over Rankings",
        description:
          "Instead of ranking products by interest rate (a metric users don't fully understand), we display a personalized match score — shifting the frame from 'best in market' to 'best for you'.",
      },
      {
        title: "RTL-Native Design",
        description:
          "Rather than mirroring an LTR layout, we designed the Arabic version natively — which meant rethinking hierarchy, icon placement, and reading flow from scratch for an audience that reads right-to-left.",
      },
    ],
    outcomes: [
      { metric: "Consent Rate", value: "+240%", description: "Improvement vs generic permission prompts in A/B test" },
      { metric: "Task Completion", value: "87%", description: "Users completing product discovery in under 10 minutes" },
      { metric: "NPS Score", value: "71", description: "Net promoter score from beta users in Riyadh pilot" },
      { metric: "Drop-off", value: "−52%", description: "Reduction in comparison flow abandonment" },
    ],
    reflection:
      "Munaaseb changed how I think about trust in digital products. Trust isn't a feeling — it's a series of design decisions that either accumulate or erode confidence. The single highest-impact change in the entire project was making permission explanations conversational rather than legal. In future fintech projects, I would build a dedicated 'trust audit' into the design process from week one.",
    nextSteps: [
      "Design a proactive financial health score feature with monthly insights",
      "Expand to insurance product matching",
      "Build a savings goal tracker tied to matched products",
    ],
  },
  {
    slug: "hala",
    number: "03",
    title: "Hala Product Innovation",
    subtitle: "Tech Vision & Integration",
    category: "Product Strategy",
    industry: "Technology",
    year: "2023",
    duration: "10 months",
    role: "Product Design Lead",
    tools: ["Figma", "Miro", "FigJam", "Notion"],
    accent: "#FF6B35",
    cardBg: "linear-gradient(148deg, #1C0D06 0%, #2C1508 55%, #1A0B05 100%)",
    highlightColor: "rgba(255,107,53,0.35)",
    visual: "mobile",
    tags: ["Product Strategy", "Innovation", "Vision 2030", "Mobile"],
    overview:
      "Hala is a Saudi tech company undergoing a major product transformation in alignment with Saudi Vision 2030 digital initiatives. As Product Design Lead, I defined the product vision, led design strategy across 3 workstreams, and redesigned core digital touchpoints to position Hala as a tech-forward brand.",
    problem:
      "Hala's existing product portfolio was fragmented — different teams had built products with inconsistent design languages, overlapping features, and no shared user model. Users had to context-switch between 3 separate apps to accomplish what should have been one seamless journey.",
    goal:
      "Define a unified product vision that consolidates Hala's fragmented portfolio into a cohesive ecosystem, establish a design system that scales across products, and deliver a flagship redesign that signals the brand's tech-first transformation.",
    researchInsights: [
      {
        title: "Fragmentation Frustration",
        description:
          "85% of existing Hala users were unaware that multiple Hala apps existed — and those who found them reported confusion about which app to use for which task.",
      },
      {
        title: "Brand Trust Lag",
        description:
          "User perception surveys showed Hala scoring 2.1/5 on 'feels like a modern tech company' — significantly below Saudi competitors despite having comparable feature sets.",
      },
      {
        title: "Power User Ceiling",
        description:
          "Advanced users hit a feature ceiling within 2 weeks of onboarding — indicating the product architecture needed depth, not just breadth.",
      },
    ],
    designProcess: {
      wireframes:
        "Conducted a full product audit across all 3 apps and mapped 140+ screens to a unified information architecture. Wire-framed the consolidated navigation model and tested it against the existing fragmented model with 24 existing users.",
      userFlows:
        "Redesigned 8 core user journeys across the unified product ecosystem. Prioritized the 3 highest-traffic flows (onboarding, primary task completion, and account management) for the first release.",
      iterations:
        "Used a weekly design sprint cadence over 6 months — 24 sprints total. Major pivots included adopting a bottom-tab navigation over the original hamburger menu and simplifying the home dashboard from 9 modules to 4.",
    },
    finalSolution: {
      description:
        "A unified product ecosystem design with a shared design system (Hala Design Language), a consolidated information architecture, and a flagship app redesign that communicates Hala's tech ambition while reducing user friction across every core flow.",
      highlights: [
        "Hala Design Language — shared token system, component library, and guidelines",
        "Consolidated IA reducing user context-switching from 3 apps to 1",
        "Flagship app redesign across 60+ screens",
        "Product roadmap design artifact used in Series B fundraising",
      ],
    },
    designDecisions: [
      {
        title: "Bottom Navigation over Hamburger Menu",
        description:
          "Mobile eye-tracking studies showed users spending 1.8 seconds hunting for features behind a hamburger. Bottom tabs expose primary navigation persistently, reducing navigation time by 60%.",
      },
      {
        title: "4-Module Dashboard over Feature Grid",
        description:
          "A 9-module dashboard tested as cognitively overwhelming. Reducing to 4 contextual modules based on usage patterns improved task initiation rates by 44%.",
      },
      {
        title: "Unified Brand Token System",
        description:
          "Rather than rebranding each product separately, a shared token system means a single brand update cascades across all products — critical for a company planning rapid future expansion.",
      },
    ],
    outcomes: [
      { metric: "App Consolidation", value: "3 → 1", description: "Products unified into a single coherent ecosystem" },
      { metric: "Navigation Time", value: "−60%", description: "Reduction in time-to-feature across primary flows" },
      { metric: "Screens Delivered", value: "60+", description: "Production-ready screens in the unified design system" },
      { metric: "Brand Perception", value: "+1.9pts", description: "Improvement in 'modern tech company' perception score" },
    ],
    reflection:
      "The Hala project taught me that the hardest design problem isn't the interface — it's the politics of product consolidation. Getting stakeholders from 3 separate product teams to agree on a shared design language required as much persuasion and facilitation as it did design craft. The biggest lesson: make design decisions data-backed and show stakeholders what users actually experience, not what stakeholders think users experience.",
    nextSteps: [
      "Design the advanced power-user tier with expanded feature depth",
      "Build out the web application counterpart to the mobile ecosystem",
      "Create an accessibility audit and improvement plan for all surfaces",
    ],
  },
  {
    slug: "sap-cloud-cx",
    number: "04",
    title: "SAP Cloud CX",
    subtitle: "Full Digital Experience · Enterprise POC",
    category: "Enterprise UX",
    industry: "Enterprise / CRM",
    year: "2023",
    duration: "4 months",
    role: "UX Lead",
    tools: ["Figma", "SAP Fiori", "Axure", "Miro"],
    accent: "#0070D2",
    cardBg: "linear-gradient(148deg, #080E1C 0%, #0C1530 55%, #070C1A 100%)",
    highlightColor: "rgba(0,112,210,0.35)",
    visual: "enterprise",
    tags: ["Enterprise", "CRM", "SAP", "B2B"],
    overview:
      "Led UX design for a proof-of-concept demonstrating SAP's Cloud CX suite as a complete customer experience platform for a major Saudi enterprise client — covering Sales Cloud, Service Cloud, and Commerce Cloud in an integrated end-to-end experience.",
    problem:
      "Enterprise CX teams operate across disconnected tools — sales reps use one system, service agents use another, and the commerce team operates a third. This siloed architecture means customer context is lost at every handoff point, creating a degraded experience for both customers and employees.",
    goal:
      "Demonstrate that SAP Cloud CX can function as a unified customer intelligence platform — where any team member can see the full customer journey and act on it in real-time — and design the UX that makes this technically complex integration feel intuitive.",
    researchInsights: [
      {
        title: "Context Loss at Handoffs",
        description:
          "Service agents reported spending an average of 4.2 minutes per interaction searching for context that sales had collected — adding up to over 2 hours of lost productivity per agent per day.",
      },
      {
        title: "Tool Fatigue",
        description:
          "CX team members used an average of 6.4 different tools per day — with context switching identified as the primary driver of errors and burnout.",
      },
      {
        title: "Reporting Blindspot",
        description:
          "No single stakeholder could see a unified CX metric — sales tracked pipeline, service tracked CSAT, and commerce tracked conversion, with no shared north star.",
      },
    ],
    designProcess: {
      wireframes:
        "Mapped the enterprise customer journey across 5 personas (sales rep, service agent, account manager, CX director, and customer). Wire-framed the unified customer 360 view that served as the connective tissue across all three clouds.",
      userFlows:
        "Designed 6 cross-cloud workflows including lead-to-service handoff, service-to-upsell escalation, and executive CX dashboard. Each flow was validated against SAP's technical integration capabilities.",
      iterations:
        "2 major design sprints with SAP solution architects and client stakeholders. Critical pivot: moving from 3 separate cloud UIs to a unified shell application with contextual module switching.",
    },
    finalSolution: {
      description:
        "A unified SAP Cloud CX shell experience featuring a persistent customer 360 sidebar, cross-cloud workflow triggers, and an executive CX command center — demonstrating SAP's full-stack CX capability in a single, coherent interface.",
      highlights: [
        "Customer 360 sidebar — persistent context across Sales, Service, and Commerce",
        "Cross-cloud action triggers enabling one-click escalation and handoff",
        "Executive CX Command Center with real-time unified metrics",
        "SAP Fiori-compliant design that integrates with existing enterprise deployment",
      ],
    },
    designDecisions: [
      {
        title: "Persistent Customer Sidebar",
        description:
          "Placing the customer 360 view in a persistent sidebar rather than a separate screen means agents never lose customer context while switching between tasks — addressing the #1 pain point without requiring workflow changes.",
      },
      {
        title: "Fiori Design Language Compliance",
        description:
          "Rather than designing a custom UI, we extended SAP Fiori's design language — which dramatically reduced enterprise adoption friction since IT teams could deploy it into existing SAP landscapes without custom development.",
      },
      {
        title: "Action-Oriented Dashboard",
        description:
          "The executive dashboard surfaces actionable anomalies (a spike in service tickets, a dip in NPS) rather than passive charts — shifting CX leadership from reporting to decision-making.",
      },
    ],
    outcomes: [
      { metric: "Context Switch Time", value: "−74%", description: "Reduction in time spent finding customer context" },
      { metric: "POC Approval", value: "100%", description: "Stakeholder approval rate in client presentation" },
      { metric: "Workflows Designed", value: "6", description: "Cross-cloud enterprise workflows delivered" },
      { metric: "Time to POC", value: "4 months", description: "Full end-to-end delivery under an aggressive timeline" },
    ],
    reflection:
      "Enterprise UX is a different discipline from consumer UX — the constraints are tighter (compliance, existing infrastructure, IT governance) and the users are experts who use tools for 8+ hours a day. The most important shift is designing for efficiency and trust over delight. An enterprise user doesn't want to be surprised by the UI — they want predictable tools they can master. The next version would invest more in keyboard navigation and power-user shortcuts.",
    nextSteps: [
      "Design the mobile field sales companion app",
      "Expand the customer 360 with AI-generated next-best-action recommendations",
      "Build an accessibility-compliant version meeting WCAG 2.1 AA standards",
    ],
  },
  {
    slug: "lean-technologies",
    number: "05",
    title: "Lean Technologies",
    subtitle: "Open Banking Infrastructure Design",
    category: "Product Design",
    industry: "Fintech / Open Banking",
    year: "2023",
    duration: "5 months",
    role: "Product Designer",
    tools: ["Figma", "Zeplin", "Confluence", "Postman"],
    accent: "#9B59B6",
    cardBg: "linear-gradient(148deg, #130C1C 0%, #1E1030 55%, #110A1A 100%)",
    highlightColor: "rgba(155,89,182,0.35)",
    visual: "network",
    tags: ["Open Banking", "Developer Tools", "API", "MENA"],
    overview:
      "Lean Technologies is Saudi Arabia's leading open banking infrastructure provider. I designed the developer portal, bank connection flows, and consumer consent UX that powers open banking integrations across the Saudi banking ecosystem.",
    problem:
      "Fintech developers integrating with Saudi banks faced a fragmented, documentation-poor experience — spending days on setup that should take hours. Meanwhile, consumer-facing bank connection flows had low conversion rates due to unclear consent language and friction-heavy authentication steps.",
    goal:
      "Design a developer experience that makes integrating Saudi open banking APIs as intuitive as integrating Stripe — and design a consumer bank connection flow that converts at best-in-class rates by making the consent process transparent, fast, and trustworthy.",
    researchInsights: [
      {
        title: "Developer Onboarding Friction",
        description:
          "Developers integrating Lean's API for the first time took an average of 3.2 days to complete their first successful data request — a barrier that was causing 30% to abandon before going live.",
      },
      {
        title: "Consumer Trust Deficit",
        description:
          "60% of Saudi consumers surveyed said they would not connect their bank account to a third-party app — primarily due to fear of unauthorized access and unclear data usage.",
      },
      {
        title: "Bank UI Fragmentation",
        description:
          "Each Saudi bank had a completely different authentication flow — users moving between bank connections experienced jarring transitions that eroded confidence in the overall integration.",
      },
    ],
    designProcess: {
      wireframes:
        "Mapped two parallel journeys: the developer integration flow (from API key generation to first data call) and the consumer bank connection flow (from app permission request through bank authentication to data consent).",
      userFlows:
        "Designed 4 developer flows (onboarding, integration guide, sandbox testing, go-live checklist) and 3 consumer flows (bank selection, authentication, consent management). Both were tested with real developer and consumer participants.",
      iterations:
        "Consumer flow underwent 5 iterations — the most difficult design challenge was normalizing the UX across 12 different bank authentication patterns while maintaining a consistent Lean brand experience.",
    },
    finalSolution: {
      description:
        "A developer portal redesign featuring interactive API documentation, a guided integration wizard, and a sandbox environment — paired with a consumer bank connection flow that achieves industry-leading conversion through transparency-first consent design.",
      highlights: [
        "Interactive API documentation with live code examples in 3 languages",
        "Guided integration wizard reducing time-to-first-call from 3.2 days to 4 hours",
        "Consumer consent flow with plain-language permission explanations",
        "Universal bank connection UI that normalizes 12 different bank authentication flows",
      ],
    },
    designDecisions: [
      {
        title: "Plain-Language Consent over Legal Copy",
        description:
          "Replacing legal permission text with conversational explanations ('We can see your account balance, but we cannot move your money') increased consumer connection completion by 3.1×.",
      },
      {
        title: "Progressive Disclosure in Documentation",
        description:
          "Hiding advanced configuration options behind 'show more' patterns reduced cognitive overload for new developers — 83% of users who saw the simplified view completed their first integration vs 47% with the full view.",
      },
      {
        title: "Universal Auth Wrapper",
        description:
          "Rather than passing users to raw bank authentication UIs, we designed a Lean-branded wrapper that provides consistent navigation, progress indication, and error recovery — regardless of which bank's authentication system is underneath.",
      },
    ],
    outcomes: [
      { metric: "Integration Time", value: "−87%", description: "Reduction in developer time-to-first-API-call" },
      { metric: "Consumer Conversion", value: "+210%", description: "Improvement in bank connection completion rate" },
      { metric: "Banks Supported", value: "12", description: "Saudi banks with normalized connection UX" },
      { metric: "Developer NPS", value: "68", description: "Net promoter score from developer community" },
    ],
    reflection:
      "Lean showed me the power of API UX — a discipline that exists at the intersection of developer experience and consumer psychology. The insight that changed everything was realizing that consumer trust in an open banking flow is earned not by the fintech app, but by the clarity of the connection moment itself. Designing that moment well — the 5 seconds where a user decides whether to connect their bank — is worth more than any downstream feature.",
    nextSteps: [
      "Design an embedded open banking widget for third-party app integration",
      "Create a self-serve developer sandbox with pre-populated test data",
      "Build a consent management dashboard for consumers to audit and revoke access",
    ],
  },
];

export function getProject(slug: string): ProjectData | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
