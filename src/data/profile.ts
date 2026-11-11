type Bi = { ar: string; en: string };

/**
 * Everything on the Experience and Credentials sections, transcribed from the
 * LinkedIn profile (linkedin.com/in/turki-almalki). Nothing is added to it: a
 * line that LinkedIn does not carry is not here.
 */

export type Job = {
  id: string;
  org: Bi;
  role: Bi;
  when: Bi;
  place?: Bi;
  logo?: string;
  mono: string;
  points: Bi[];
};

export const JOBS: Job[] = [
  {
    id: "monshaat",
    org: { ar: "منشآت", en: "Monsha'at" },
    role: { ar: "قائد هندسة البرمجيات", en: "Software Engineering Leader" },
    when: { ar: "أكتوبر 2024 — الآن", en: "Oct 2024 — Present" },
    logo: "/hero/archive/mark-monshaat.png",
    mono: "M",
    points: [
      {
        ar: "قدت تجديد موقع مركز الابتكار بما يخدم أهداف الابتكار الوطنية.",
        en: "Led the revamp of the Innovation Center website, aligned with national innovation goals.",
      },
      {
        ar: "بنيت بنية برمجية داخلية قابلة للتوسع لدعم الدعم الفني وتسريع الاستجابة.",
        en: "Built a scalable internal platform for technical support, cutting response and resolution time.",
      },
      {
        ar: "وسّعت قاعدة بيانات داخلية ضخمة على NoCoDB وأتمتت بياناتها للإدارات.",
        en: "Expanded a large internal database on NoCoDB and automated its data for departments.",
      },
      {
        ar: "صممت لوحات Metabase لمتابعة المؤشرات والأثر لحظة بلحظة.",
        en: "Designed Metabase dashboards for real-time KPIs and impact.",
      },
      {
        ar: "أرشد عدة شركات ناشئة في بناء منتجاتها الأولى بتقنيات خفيفة وقابلة للنمو.",
        en: "Mentor several startups through their first products on lean, scalable stacks.",
      },
    ],
  },
  {
    id: "tuwaiq",
    org: { ar: "طويق باي", en: "Tuwaiq Pay" },
    role: { ar: "قائد فريق هندسة البرمجيات", en: "Software Engineering Team Lead" },
    when: { ar: "فبراير — سبتمبر 2025", en: "Feb — Sep 2025" },
    mono: "T",
    points: [{ ar: "قيادة فريق تطبيق طويق باي، عن بُعد وبدوام جزئي.", en: "Led the team behind the Tuwaiq Pay app — remote, part-time." }],
  },
  {
    id: "munaseb",
    org: { ar: "مناسب", en: "Munaseb" },
    role: { ar: "مدير هندسة البرمجيات", en: "Software Engineer Manager" },
    when: { ar: "فبراير — نوفمبر 2024", en: "Feb — Nov 2024" },
    logo: "/munasiblogo.jpeg",
    mono: "م",
    points: [{ ar: "إدارة هندسة موقع مناسب، بدوام جزئي.", en: "Managed engineering for the Munaseb website — part-time." }],
  },
  {
    id: "emkan",
    org: { ar: "إمكان", en: "EMKAN" },
    role: { ar: "مهندس برمجيات III · II", en: "Software Engineer III · II" },
    when: { ar: "يوليو 2022 — أكتوبر 2024", en: "Jul 2022 — Oct 2024" },
    logo: "/emkanlogo.png",
    mono: "E",
    points: [
      {
        ar: "قدت فريق مطورين وأدرت مختبر ابتكار للبحث والتطوير.",
        en: "Led a team of developers and ran an Innovation Lab (R&D).",
      },
      {
        ar: "صممت وطورت وأدرت النسخة الجديدة من تطبيق إمكان للتمويل بـ React Native.",
        en: "Designed, built and maintained the new Emkan Finance app in React Native.",
      },
    ],
  },
  {
    id: "ithnain",
    org: { ar: "اثنين", en: "Ithnain" },
    role: { ar: "مهندس برمجيات", en: "Software Engineer" },
    when: { ar: "يناير — أغسطس 2022", en: "Jan — Aug 2022" },
    logo: "/ithninlogo.jpeg",
    mono: "ا",
    points: [
      {
        ar: "أعدت تصميم وتطوير تطبيق الجوال في شركة ناشئة من Techstars '23.",
        en: "Revamped and built the mobile app at a Techstars '23 startup.",
      },
    ],
  },
  {
    id: "alrajhi",
    org: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
    role: { ar: "مهندس برمجيات أول", en: "Senior Software Engineer" },
    when: { ar: "أغسطس 2019 — يوليو 2022", en: "Aug 2019 — Jul 2022" },
    logo: "/alrajhilogo.png",
    mono: "R",
    points: [
      {
        ar: "صممت وطورت وأدرت تطبيق الراجحي للجوال.",
        en: "Designed, built and maintained the Al Rajhi mobile app.",
      },
      { ar: "قائد قسم البحث والتطوير بمشاريع تنفيذية.", en: "Led the R&D department on hands-on milestone projects." },
    ],
  },
  {
    id: "tarqeem",
    org: { ar: "ترقيم", en: "Tarqeem" },
    role: { ar: "مهندس برمجيات أول", en: "Senior Software Engineer" },
    when: { ar: "فبراير 2020 — سبتمبر 2021", en: "Feb 2020 — Sep 2021" },
    mono: "T",
    points: [
      {
        ar: "قدت «إنجاز»: حل SaaS لتركيب المنتجات المنزلية عند الطلب للتجار.",
        en: "Led Najez, a SaaS for on-demand home installation, built for retailers.",
      },
    ],
  },
  {
    id: "aramco",
    org: { ar: "أرامكو السعودية", en: "Saudi Aramco" },
    role: { ar: "متدرب", en: "Intern" },
    when: { ar: "يونيو — أكتوبر 2018", en: "Jun — Oct 2018" },
    logo: "/hero/archive/mark-aramco.png",
    mono: "A",
    points: [{ ar: "برنامج التدريب الصيفي، الظهران.", en: "Summer internship program, Dhahran." }],
  },
];

export const SCHOOL = {
  name: { ar: "جامعة الملك فيصل", en: "King Faisal University" },
  degree: { ar: "بكالوريوس علوم الحاسب", en: "BSc, Computer Science" },
  when: "2014 — 2019",
};

export type Build = { id: string; title: Bi; when: Bi; body: Bi; tags: string[] };

export const BUILDS: Build[] = [
  {
    id: "goparking",
    title: { ar: "GoParking", en: "GoParking" },
    when: { ar: "2019", en: "2019" },
    body: {
      ar: "تطبيق مواقف ذكية لمسابقة المدن الذكية في KAUST، بُني على SAP HANA Cloud بلغة Swift.",
      en: "A smart-parking app for the KAUST smart-city challenge, built on SAP HANA Cloud in Swift.",
    },
    tags: ["Swift", "Xcode", "SAP HANA"],
  },
  {
    id: "ar-maps",
    title: { ar: "خرائط الواقع المعزز", en: "AR Maps" },
    when: { ar: "مشروع التخرج · 2019", en: "Graduation project · 2019" },
    body: {
      ar: "ملاحة بالواقع المعزز داخل حرم جامعة الملك فيصل، بـ Android Studio وUnity3D.",
      en: "Augmented-reality navigation across the King Faisal University campus, in Android Studio and Unity3D.",
    },
    tags: ["Java", "Unity3D", "Android"],
  },
];

export type Award = { id: string; place: Bi; title: Bi; by: Bi; when: string; note: Bi };

export const AWARDS: Award[] = [
  {
    id: "waad",
    place: { ar: "المركز الأول", en: "1st place" },
    title: { ar: "وعد أرامكو", en: "Wa'ad Aramco" },
    by: { ar: "أرامكو · وادي الظهران للتقنية", en: "Aramco · Dhahran Techno-Valley" },
    when: "Dec 2018",
    note: { ar: "الأول بين 150 مشاركًا، بجائزة 100 ألف.", en: "First among 150 participants, with a 100k award." },
  },
  {
    id: "kaust",
    place: { ar: "المركز الثاني", en: "2nd place" },
    title: { ar: "هاكاثون SAP وKAUST", en: "SAP & KAUST Hackathon" },
    by: { ar: "جامعة الملك عبدالله للعلوم والتقنية", en: "King Abdullah University of Science and Technology" },
    when: "Feb 2019",
    note: { ar: "الثاني بين 38 مشاركًا بأدوات SAP HANA السحابية.", en: "Second among 38 participants, on SAP HANA cloud tools." },
  },
  {
    id: "urc",
    place: { ar: "جائزة", en: "Award" },
    title: { ar: "مؤتمر البحث للطلاب", en: "Undergraduate Research Conference" },
    by: { ar: "جامعة زايد", en: "Zayed University" },
    when: "Apr 2019",
    note: { ar: "في المؤتمر السنوي الحادي عشر للحوسبة التطبيقية.", en: "At the eleventh annual conference on applied computing." },
  },
];

export type Cert = { id: string; title: Bi; by: string; when: string; mono: string; hue: number };

export const CERTS: Cert[] = [
  { id: "scrum", title: { ar: "Professional Scrum Master I", en: "Professional Scrum Master I" }, by: "Scrum.org", when: "May 2020", mono: "S", hue: 212 },
  { id: "ga", title: { ar: "هندسة البرمجيات المكثّفة · Full Stack", en: "Software Engineering Immersive · Full Stack" }, by: "General Assembly", when: "Sep 2019", mono: "GA", hue: 8 },
  { id: "spark", title: { ar: "برنامج SPARK — أكاديمية مسك ونيوم", en: "SPARK Program — Misk Academy & NEOM" }, by: "Misk Skills", when: "Dec 2021", mono: "M", hue: 160 },
  { id: "udfe", title: { ar: "Front-End Web Developer", en: "Front-End Web Developer" }, by: "Udacity", when: "Mar 2020", mono: "U", hue: 196 },
  { id: "uda", title: { ar: "Data Analyst", en: "Data Analyst" }, by: "Udacity", when: "Jun 2020", mono: "U", hue: 196 },
  { id: "itil", title: { ar: "ITIL Foundation", en: "ITIL Foundation" }, by: "AXELOS", when: "Mar 2020", mono: "IT", hue: 268 },
  { id: "waed", title: { ar: "مجتمع الابتكار", en: "Innovation Ecosystem Society" }, by: "Wa'ed Ventures", when: "Dec 2018", mono: "W", hue: 32 },
  { id: "sec", title: { ar: "Security+", en: "Security+" }, by: "CompTIA", when: "Jan 2020 · expired 2023", mono: "C+", hue: 350 },
  { id: "net", title: { ar: "Network+", en: "Network+" }, by: "CompTIA", when: "Feb 2020 · expired 2023", mono: "C+", hue: 350 },
];
