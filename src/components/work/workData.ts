import { PROJECTS, localizeProject, type ProjectData } from "@/data/projects";
import { STOPS } from "@/components/sections/FlightPath";

type Bi = { ar: string; en: string };
type Lang = "ar" | "en";

/**
 * Everything the Work section and its pop-up read.
 *
 * Nothing here is written fresh: the five long case studies come from
 * `PROJECTS` (+ their Arabic in `projectsAr`), and the two shorter stories come
 * from the timeline's own `STOPS`, so the pop-up cannot describe work the
 * timeline does not have. A tile with no photograph is drawn from its own
 * accent colour rather than borrowing someone else's picture.
 */

export type Shot = { src: string; label: string };

export type Metric = { value: string; label: string };

export type Chapter =
  | { kind: "text"; label: string; title?: string; body: string }
  | { kind: "pair"; label: string; left: { title: string; body: string }; right: { title: string; body: string } }
  | { kind: "cards"; label: string; items: { title: string; body: string }[] }
  | { kind: "list"; label: string; body: string; items: string[] }
  | { kind: "metrics"; label: string; items: { value: string; label: string; body?: string }[] }
  | { kind: "quote"; label: string; body: string };

export type WorkCase = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  industry: string;
  year: string;
  accent: string;
  /** deep colour the art tile and the pop-up header are drawn on */
  ground: string;
  cover?: string;
  /** CSS object-position for the card crop — where the subject of the picture sits */
  pos?: string;
  gallery: Shot[];
  tags: string[];
  chapters: Chapter[];
  link?: { label: string; href: string };
};

const DASHBOARD_URL = "https://turkialmalki.github.io/film-accelerator-dashboard/";

const UI = {
  ar: {
    overview: "نظرة عامة",
    problem: "المشكلة",
    goal: "الهدف",
    research: "ما كشفه البحث",
    solution: "الحل",
    decisions: "قرارات التصميم",
    outcomes: "الأثر",
    reflection: "تأمّل",
    story: "القصة",
    highlights: "أبرز ما تم",
  },
  en: {
    overview: "Overview",
    problem: "The problem",
    goal: "The goal",
    research: "What research showed",
    solution: "The solution",
    decisions: "Design decisions",
    outcomes: "Outcomes",
    reflection: "Reflection",
    story: "The story",
    highlights: "What shipped",
  },
} as const;

/* Hand-picked per case study: the project data carries one `image` at most, and
   the extra frames are plates the site already ships. */
const COVER: Record<string, { cover?: string; pos?: string; gallery: { src: string; label: Bi }[] }> = {
  basebox: {
    cover: "/hero/basebox.jpg",
    pos: "left center",
    gallery: [
      { src: "/hero/basebox.jpg", label: { ar: "منصة BaseBox", en: "The BaseBox platform" } },
      { src: "/hero/basebox-dash.jpg", label: { ar: "لوحة التحكم", en: "The dashboard" } },
    ],
  },
  munaaseb: {
    cover: "/hero/munaseb.jpg",
    pos: "center top",
    gallery: [
      { src: "/hero/munaseb.jpg", label: { ar: "تجربة مناسب", en: "The Munaseb experience" } },
      { src: "/op/munasib.jpg", label: { ar: "واجهة المنتج", en: "Product interface" } },
    ],
  },
};

function fromProject(p: ProjectData, lang: Lang): WorkCase {
  const l = localizeProject(p, lang);
  const u = UI[lang];
  const art = COVER[p.slug] ?? { gallery: [] };

  return {
    id: p.slug,
    num: p.number,
    title: l.title,
    subtitle: l.subtitle,
    industry: l.industry,
    year: p.year,
    accent: p.accent,
    ground: p.cardBg,
    cover: art.cover,
    pos: art.pos,
    gallery: art.gallery.map((g) => ({ src: g.src, label: g.label[lang] })),
    tags: l.tags,
    chapters: [
      { kind: "text", label: u.overview, body: l.overview },
      {
        kind: "pair",
        label: `${u.problem} · ${u.goal}`,
        left: { title: u.problem, body: l.problem },
        right: { title: u.goal, body: l.goal },
      },
      {
        kind: "cards",
        label: u.research,
        items: l.researchInsights.map((r) => ({ title: r.title, body: r.description })),
      },
      {
        kind: "list",
        label: u.solution,
        body: l.finalSolution.description,
        items: l.finalSolution.highlights,
      },
      {
        kind: "cards",
        label: u.decisions,
        items: l.designDecisions.map((r) => ({ title: r.title, body: r.description })),
      },
      {
        kind: "metrics",
        label: u.outcomes,
        items: l.outcomes.map((o) => ({ value: o.value, label: o.metric, body: o.description })),
      },
      { kind: "quote", label: u.reflection, body: l.reflection },
    ],
  };
}

function stop(id: string) {
  const s = STOPS.find((x) => x.id === id);
  if (!s) throw new Error(`workData: no timeline stop "${id}"`);
  return s;
}

function fromStop(
  id: string,
  opts: {
    num: string;
    title: Bi;
    subtitle: Bi;
    industry: Bi;
    year: string;
    accent: string;
    ground: string;
    cover: string;
    pos?: string;
    link?: { label: Bi; href: string };
    only?: number[];
  },
  lang: Lang,
): WorkCase {
  const s = stop(id);
  const u = UI[lang];
  const shots = (s.proof ?? []).filter((_, i) => !opts.only || opts.only.includes(i));
  const chapters: Chapter[] = [{ kind: "text", label: u.story, body: s.summary[lang] }];
  if (s.highlights?.length) {
    chapters.push({
      kind: "list",
      label: u.highlights,
      body: "",
      items: s.highlights.map((h) => h[lang]),
    });
  }
  if (s.metrics?.length) {
    chapters.push({
      kind: "metrics",
      label: u.outcomes,
      items: s.metrics.map((m) => ({ value: m.value, label: m.label[lang] })),
    });
  }
  return {
    id,
    num: opts.num,
    title: opts.title[lang],
    subtitle: opts.subtitle[lang],
    industry: opts.industry[lang],
    year: opts.year,
    accent: opts.accent,
    ground: opts.ground,
    cover: opts.cover,
    pos: opts.pos,
    gallery: shots.map((p) => ({ src: p.src, label: p.label[lang] })),
    tags: (s.tags ?? []).map((t) => (typeof t === "string" ? t : t[lang])),
    chapters,
    link: opts.link && { label: opts.link.label[lang], href: opts.link.href },
  };
}

export function buildWork(lang: Lang): WorkCase[] {
  const study = (slug: string) => {
    const p = PROJECTS.find((x) => x.slug === slug);
    if (!p) throw new Error(`workData: no project "${slug}"`);
    return fromProject(p, lang);
  };

  return [
    study("basebox"),
    study("munaaseb"),
    fromStop(
      "film",
      {
        num: "03",
        title: { ar: "لوحة مسرّعة الأفلام", en: "Film Accelerator Dashboard" },
        subtitle: { ar: "بيانات خام إلى قرار تنفيذي", en: "Raw data to an executive decision" },
        industry: { ar: "هيئة الأفلام", en: "Saudi Film Commission" },
        year: "2026",
        accent: "#E8B04A",
        ground: "linear-gradient(148deg, #1A1408 0%, #2A200C 55%, #17110A 100%)",
        cover: "/hero/fba.jpg",
        pos: "center 30%",
        link: {
          label: { ar: "افتح اللوحة مباشرة", en: "Open the live dashboard" },
          href: DASHBOARD_URL,
        },
      },
      lang,
    ),
    fromStop(
      "alrajhi",
      {
        num: "04",
        title: { ar: "تطبيق مصرف الراجحي", en: "Al Rajhi Mobile Banking" },
        subtitle: { ar: "رحلات مصرفية معقّدة، بسيطة على الجوال", en: "Complex banking, made simple on mobile" },
        industry: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
        year: "2019–2022",
        accent: "#1E8FFF",
        ground: "linear-gradient(148deg, #0A1424 0%, #0F2038 55%, #09121F 100%)",
        cover: "/hero/alrajhi-pair.jpg",
        pos: "center 40%",
      },
      lang,
    ),
    fromStop(
      "emkan",
      {
        num: "05",
        title: { ar: "منصة إمكان", en: "Emkan Platform" },
        subtitle: { ar: "من التقديم إلى الصرف في تجربة واحدة", en: "From application to disbursement, in one flow" },
        industry: { ar: "إمكان للتمويل", en: "Emkan Finance" },
        year: "2022–2024",
        accent: "#2BB673",
        ground: "linear-gradient(148deg, #0A1A14 0%, #0F2A20 55%, #09150F 100%)",
        cover: "/hero/emkan.jpg",
        pos: "center 30%",
      },
      lang,
    ),
    fromStop(
      "ventures",
      {
        num: "06",
        title: { ar: "اثنين", en: "Ithnain" },
        subtitle: { ar: "تجربة اجتماعية", en: "A social experience" },
        industry: { ar: "تطبيق اجتماعي", en: "Social app" },
        year: "",
        accent: "#FF6B8A",
        ground: "linear-gradient(148deg, #220E16 0%, #321522 55%, #1B0C12 100%)",
        cover: "/hero/ithnain.jpg",
        pos: "left center",
        only: [1],
      },
      lang,
    ),
  ];
}
