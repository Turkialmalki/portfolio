"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  LuBadgeCheck,
  LuGraduationCap,
  LuMedal,
  LuSparkles,
  LuTrophy,
} from "react-icons/lu";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Live artefact of the Film Accelerator engagement — same URL the services
   page links to (see src/app/services/WorkObjects.tsx). */
const DASHBOARD_URL = "https://turkialmalki.github.io/film-accelerator-dashboard/";

type Bi = { ar: string; en: string };

type Proof = {
  src: string;
  /** Product / photograph name shown under the frame. */
  label: Bi;
  /** Sector, programme or product line — the small line under the label. */
  meta: Bi;
  /** object-position for the crop. Every frame is a fixed ratio, so this is
      what decides whether the subject sits well inside it. */
  pos?: string;
  href?: string;
};

type Metric = { value: string; label: Bi };

type Badge = { icon: "trophy" | "medal" | "cap"; text: Bi };

/**
 * One stop on the route.
 *
 * Every field here is transcribed from something the repository already holds:
 * `JOBS` in src/app/about/AboutClient.tsx (employers, dates, outcomes), the
 * story slides in src/components/sections/Projects.tsx, the Film Accelerator
 * figures in src/app/services/WorkObjects.tsx, and the workshop / consulting
 * counts in src/i18n/translations.ts. Nothing is invented — a stop with no
 * documented date carries an icon anchor instead of a year.
 */
type Stop = {
  id: string;
  /** Visual anchor in the gutter. Omitted where no date is documented. */
  year?: string;
  /** Anchor glyph used when there is no year. */
  anchor?: "trophy" | "spark";
  period: Bi;
  org: Bi;
  role: Bi;
  summary: Bi;
  logo?: string;
  /** Logos that are photographs fill the tile; marks are letter-boxed. */
  logoFit?: "cover" | "contain";
  current?: boolean;
  badges?: Badge[];
  metrics?: Metric[];
  highlights?: Bi[];
  tags?: string[];
  proof?: Proof[];
  /** Shared frame ratio for this stop's proof cards. */
  ratio?: number;
  link?: { label: Bi; href: string; external?: boolean };
  /** Credential chips — only the practice interlude carries them. */
  credentials?: boolean;
};

const STOPS: Stop[] = [
  {
    id: "aramco",
    year: "2018",
    period: { ar: "2018", en: "2018" },
    org: { ar: "أرامكو السعودية", en: "Saudi Aramco" },
    role: { ar: "تدريب تعاوني — هندسة", en: "Engineering Co-op" },
    summary: {
      ar: "من هنا بدأت الرحلة: أساسيات العمل المؤسسي، وتسليم البرمجيات، وحل المشكلات الهندسية بطريقة منظّمة.",
      en: "Where the journey began — enterprise foundations, software delivery, and structured engineering problem-solving.",
    },
    ratio: 1.62,
    proof: [
      {
        src: "/aramco.jpeg",
        label: { ar: "أرامكو السعودية", en: "Saudi Aramco" },
        meta: { ar: "طاقة ومؤسسات", en: "Energy & enterprise" },
        pos: "center 58%",
      },
    ],
  },
  {
    id: "awards",
    anchor: "trophy",
    period: { ar: "نموّ مستمر", en: "Continuous growth" },
    org: { ar: "جوائز وتأسيس أكاديمي", en: "Awards & foundation" },
    role: { ar: "مسابقات برمجية وشهادة جامعية", en: "Programming competitions & degree" },
    summary: {
      ar: "المركز الأول في مسابقة أرامكو «وعد» للبرمجة، والمركز الثاني في مسابقة كاوست، وبكالوريوس علوم حاسب من جامعة الملك فيصل بتكريم من عميد الكلية.",
      en: "1st place at the Aramco Wa'ed programming competition, 2nd at KAUST, and a Computer Science degree from King Faisal University, recognized by the College Dean.",
    },
    badges: [
      { icon: "trophy", text: { ar: "المركز الأول — وعد", en: "1st — Wa'ed" } },
      { icon: "medal", text: { ar: "المركز الثاني — كاوست", en: "2nd — KAUST" } },
      { icon: "cap", text: { ar: "بكالوريوس علوم حاسب", en: "BSc Computer Science" } },
    ],
    ratio: 1.62,
    proof: [
      {
        src: "/IMG-20181201-WA0054.jpg",
        label: { ar: "فريق مسابقة وعد", en: "Wa'ed competition team" },
        meta: { ar: "المركز الأول", en: "1st place" },
        pos: "center 40%",
      },
    ],
  },
  {
    id: "alrajhi",
    year: "2019",
    period: { ar: "أغسطس 2019 — يوليو 2022", en: "Aug 2019 — Jul 2022" },
    org: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
    role: { ar: "مهندس برمجيات أول", en: "Senior Software Engineer" },
    summary: {
      ar: "قدت تطوير تجربة الجوال للعملاء بـ React Native، وحوّلت متطلبات مصرفية معقّدة إلى رحلات واضحة بالتعاون مع فرق التصميم.",
      en: "Led the customer-facing mobile experience in React Native, turning complex banking requirements into clean mobile journeys with the design team.",
    },
    logo: "/alrajhilogo.png",
    logoFit: "cover",
    metrics: [
      { value: "95%", label: { ar: "تقييم إيجابي", en: "positive feedback" } },
      { value: "+90%", label: { ar: "زيادة في التحميلات", en: "more downloads" } },
    ],
    tags: ["React Native", "JavaScript", "Redux", "Figma"],
    ratio: 1.4,
    proof: [
      {
        src: "/hero/alrajhi.jpg",
        label: { ar: "تطبيق مصرف الراجحي", en: "Al Rajhi mobile banking" },
        meta: { ar: "خدمات مصرفية للأفراد", en: "Retail banking" },
      },
    ],
  },
  {
    id: "emkan",
    year: "2022",
    period: { ar: "يوليو 2022 — أكتوبر 2024", en: "Jul 2022 — Oct 2024" },
    org: { ar: "إمكان", en: "Emkan" },
    role: { ar: "مهندس برمجيات رئيسي", en: "Lead Software Engineer" },
    summary: {
      ar: "قدت تحديث منصات التجار الرقمية على الويب والجوال، مع تحسينات في التجربة وتكاملات مدعومة بالذكاء الاصطناعي.",
      en: "Led the modernization of the core digital merchant platforms across web and mobile, with UX improvements and AI-driven integrations.",
    },
    logo: "/emkanlogo.png",
    logoFit: "contain",
    metrics: [
      { value: "+150%", label: { ar: "رضا العملاء", en: "customer satisfaction" } },
    ],
    tags: ["React", "TypeScript", "Dynatrace", "Countly"],
    ratio: 1.85,
    proof: [
      {
        src: "/hero/emkan.jpg",
        label: { ar: "إمكان", en: "Emkan Finance" },
        meta: { ar: "تقنية مالية", en: "Fintech" },
      },
    ],
  },
  {
    id: "practice",
    anchor: "spark",
    period: { ar: "على امتداد الرحلة", en: "Across the journey" },
    org: { ar: "ورش عمل واستشارات", en: "Workshops & consulting" },
    role: { ar: "مستشار أعمال معتمد · مدرّب", en: "Certified business consultant · Instructor" },
    summary: {
      ar: "أدرّب الفرق ورواد الأعمال على الطريق من الفكرة إلى MVP، وأقدّم استشارات تقنية رسمية عبر منصة منشآت، وأُدرّس هندسة البرمجيات عبر منصة iHash+.",
      en: "I coach teams and founders on the road from idea to MVP, consult officially through the Monshaat platform, and teach software engineering on iHash+.",
    },
    metrics: [
      { value: "20+", label: { ar: "ورشة عمل", en: "workshops" } },
      { value: "1,000+", label: { ar: "ساعة استشارية", en: "consultation hours" } },
      { value: "9+", label: { ar: "سنوات خبرة", en: "years of experience" } },
    ],
    ratio: 1.5,
    proof: [
      {
        src: "/turki.jpg",
        label: { ar: "ورشة MVP", en: "MVP workshop" },
        meta: { ar: "مركز الابتكار — منشآت", en: "Innovation Center — Monsha'at" },
        pos: "58% 38%",
      },
      {
        src: "/speaking-stage.jpg",
        label: { ar: "على المسرح", en: "On stage" },
        meta: { ar: "هيئة الأدب والنشر والترجمة", en: "Literature, Publishing & Translation Commission" },
        pos: "center 34%",
      },
      {
        src: "/1.jpg",
        label: { ar: "مدرّب معتمد", en: "Certified instructor" },
        meta: { ar: "برامج تدريب وابتكار", en: "Training & innovation programs" },
        pos: "48% 32%",
      },
    ],
    credentials: true,
  },
  {
    id: "monshaat",
    year: "2024",
    period: { ar: "أكتوبر 2024 — الآن", en: "Oct 2024 — Today" },
    org: { ar: "منشآت — مركز الابتكار", en: "Monsha'at — Innovation Center" },
    role: { ar: "قائد هندسة برمجيات", en: "Engineering Leader" },
    summary: {
      ar: "أقود المبادرات الرقمية داخل مركز الابتكار: أحوّل احتياجات الأعمال إلى خطط تنفيذية لمنتجات الويب والجوال، وأعمل مع فرق المنتج والتصميم والأنظمة الخلفية حتى الإطلاق.",
      en: "I lead digital initiatives inside the Innovation Center — turning business needs into prioritized roadmaps for web and mobile, and working with product, design and backend teams through to launch.",
    },
    logo: "/monshaat.jpg",
    logoFit: "cover",
    current: true,
    highlights: [
      { ar: "تجديد موقع مركز الابتكار", en: "Innovation Center website revamp" },
      { ar: "منصة بيانات NoCoDB ولوحات Metabase", en: "NoCoDB data platform & Metabase dashboards" },
      { ar: "برامج الابتكار ودعم الشركات الناشئة", en: "Innovation and startup programs" },
      { ar: "استشارات وإرشاد للفرق", en: "Consulting and mentoring" },
    ],
    tags: ["Next.js", "NoCoDB", "Metabase", "AI tools"],
    ratio: 1.62,
    proof: [
      {
        src: "/monshaat.jpg",
        label: { ar: "مركز الابتكار — منشآت", en: "Monsha'at Innovation Center" },
        meta: { ar: "ابتكار حكومي", en: "Government innovation" },
        pos: "center 62%",
      },
    ],
  },
  {
    id: "ventures",
    anchor: "spark",
    period: { ar: "بالتوازي مع الرحلة", en: "Alongside the journey" },
    org: { ar: "منتجات ومشاريع مستقلة", en: "Independent products & ventures" },
    role: { ar: "عقلية مؤسس · هندسة منتج", en: "Founder mindset · product engineering" },
    summary: {
      ar: "منتجات بنيتها بالتوازي مع العمل بدوام كامل: خدمات مصرفية مفتوحة، تجربة اجتماعية، ومنصة SaaS مدعومة بالذكاء الاصطناعي.",
      en: "Products built alongside the full-time roles — open banking, a social experience, and an AI-powered SaaS platform.",
    },
    ratio: 2.1,
    proof: [
      {
        src: "/hero/munaseb.jpg",
        label: { ar: "مناسب", en: "Munaseb" },
        meta: { ar: "خدمات مصرفية مفتوحة", en: "Open banking" },
      },
      {
        src: "/hero/ithnain.jpg",
        label: { ar: "اثنين", en: "Ithnain" },
        meta: { ar: "تطبيق اجتماعي", en: "Social app" },
      },
      {
        src: "/hero/basebox.jpg",
        label: { ar: "BaseBox", en: "BaseBox" },
        meta: { ar: "منصة SaaS بالذكاء الاصطناعي", en: "AI-powered SaaS" },
      },
    ],
  },
  {
    id: "film",
    year: "2026",
    period: { ar: "2026", en: "2026" },
    org: { ar: "مسرّعة أعمال الأفلام", en: "Film Business Accelerator" },
    role: { ar: "لوحة متابعة المحفظة · هيئة الأفلام", en: "Portfolio dashboard · Saudi Film Commission" },
    summary: {
      ar: "حوّلت بيانات دفعة من 20 شركة إلى لوحة قرار تنفيذية: الجاهزية، مراحل الاستثمار، ومؤشر صحة المحفظة.",
      en: "Turned the raw data of a 20-company batch into an executive decision dashboard — readiness, investment stages, and a portfolio health index.",
    },
    /* No logo tile here on purpose: the accelerator's mark is a pale wordmark
       that reads as an empty box at 44px, and the proof card already carries
       the brand at a size where it is legible. */
    metrics: [
      { value: "20", label: { ar: "شركة في الدفعة", en: "companies in batch" } },
      { value: "64%", label: { ar: "متوسط الجاهزية", en: "avg. readiness" } },
      { value: "118", label: { ar: "وظيفة مباشرة", en: "direct jobs" } },
    ],
    ratio: 1.68,
    proof: [
      {
        src: "/hero/fba.jpg",
        label: { ar: "لوحة متابعة المسرّعة", en: "Accelerator dashboard" },
        meta: { ar: "بيانات خام إلى قرار", en: "Raw data to decision" },
        href: DASHBOARD_URL,
      },
    ],
    link: {
      label: { ar: "افتح اللوحة مباشرة", en: "Open the live dashboard" },
      href: DASHBOARD_URL,
      external: true,
    },
  },
  {
    id: "cv-product",
    anchor: "spark",
    period: { ar: "اليوم", en: "Today" },
    org: { ar: "مراجعة السيرة الذاتية وتحليل المسار", en: "CV Review & Career Analysis" },
    role: { ar: "منتج مستقل — مباشر الآن", en: "Independent product — live" },
    summary: {
      ar: "منتج بنيته من الفكرة إلى الإطلاق: ترفع سيرتك الذاتية، فتحصل على تقييم واضح، وما الذي يعيقها، وأول خطوة لتحسينها.",
      en: "Designed and built end to end: upload a CV and get a clear score, what is holding it back, and the first thing to fix.",
    },
    tags: ["Next.js", "TypeScript", "Supabase"],
    link: {
      label: { ar: "جرّب التحليل", en: "Try the analysis" },
      href: "/career",
    },
  },
];

const COPY = {
  ar: {
    kicker: "خط الرحلة",
    title: "من أول سطر كود إلى قيادة منتجات رقمية",
    lede: "رحلة واحدة متصلة عبر المصارف، التقنية المالية، الابتكار الحكومي، والمنتجات المستقلة — وكل محطة معها ما يثبتها.",
    span: "2018 — اليوم",
    years: "‎+9 سنوات",
    departure: "الإقلاع · 2018",
    arrival: "اليوم",
    arrivalLine: "الرحلة مستمرة — والمحطة القادمة قد تكون معك.",
    arrivalCta: "لنتحدث",
    credentialsLabel: "اعتمادات",
    proofLabel: "أعمال داعمة",
    now: "الآن",
    aria: "المسار المهني",
  },
  en: {
    kicker: "Flight path",
    title: "From the first line of code to leading digital products",
    lede: "One continuous journey through banking, fintech, government innovation and independent products — every stop carries the work that proves it.",
    span: "2018 — Today",
    years: "9+ years",
    departure: "Departure · 2018",
    arrival: "Today",
    arrivalLine: "The journey continues — the next stop could be yours.",
    arrivalCta: "Let's talk",
    credentialsLabel: "Credentials",
    proofLabel: "Supporting work",
    now: "Now",
    aria: "Career path",
  },
};

const BADGE_ICON = {
  trophy: LuTrophy,
  medal: LuMedal,
  cap: LuGraduationCap,
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function FlightPath() {
  const { t, lang } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();

  const routeRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const dotsRef = useRef<Array<HTMLSpanElement | null>>([]);

  /* The rail is drawn between the first and last node dot, so it is measured
     rather than guessed — that keeps it exact in both scripts and at every
     breakpoint, where the dots sit at different offsets. */
  const [rail, setRail] = useState({ top: 0, height: 0, x: 0 });

  const measure = useCallback(() => {
    const route = routeRef.current;
    const dots = dotsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!route || dots.length < 2) return;
    const base = route.getBoundingClientRect();
    const first = dots[0].getBoundingClientRect();
    const last = dots[dots.length - 1].getBoundingClientRect();
    const top = first.top + first.height / 2 - base.top;
    const bottom = last.top + last.height / 2 - base.top;
    const x = first.left + first.width / 2 - base.left;
    setRail((prev) =>
      Math.abs(prev.top - top) < 0.5 &&
      Math.abs(prev.height - (bottom - top)) < 0.5 &&
      Math.abs(prev.x - x) < 0.5
        ? prev
        : { top, height: bottom - top, x },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const route = routeRef.current;
    if (!route) return;
    const ro = new ResizeObserver(measure);
    ro.observe(route);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Re-measure once webfonts land: Arabic and Latin metrics differ enough to
  // move every dot by a few pixels.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.82", "end 0.6"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 30,
    mass: 0.32,
  });

  const fillScale = useTransform(progress, [0, 1], [0, 1]);
  const planeY = useTransform(progress, [0, 1], [0, rail.height]);
  const planeOpacity = useTransform(progress, [0, 0.015, 0.985, 1], [0, 1, 1, 0]);

  return (
    <section
      className="fp"
      id="journey"
      aria-label={copy.aria}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="fp-field" aria-hidden="true">
        <div className="fp-dots" />
        <div className="fp-glow" />
      </div>

      <div className="fp-inner">
        <RouteEntry railX={rail.x} reduced={Boolean(reduced)} />

        <motion.header
          className="fp-head"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="fp-kicker">
            <PlaneGlyph size={12} />
            {copy.kicker}
          </span>
          <h2 className="fp-title">{copy.title}</h2>
          <p className="fp-lede">{copy.lede}</p>
          <div className="fp-span">
            <span className="fp-span-chip">{copy.span}</span>
            <span className="fp-span-chip fp-span-chip-alt">{copy.years}</span>
          </div>
        </motion.header>

        <div className="fp-route" ref={routeRef}>
          <div
            className="fp-rail"
            aria-hidden="true"
            style={{ top: rail.top, height: rail.height || undefined }}
          >
            <span className="fp-rail-base" />
            <motion.span
              className="fp-rail-fill"
              style={reduced ? { scaleY: 1 } : { scaleY: fillScale }}
            />
            {!reduced && rail.height > 0 && (
              <motion.span
                className="fp-plane"
                style={{ y: planeY, opacity: planeOpacity }}
              >
                <span className="fp-plane-wake" />
                <PlaneGlyph size={16} />
              </motion.span>
            )}
          </div>

          <span className="fp-cap fp-cap-start" aria-hidden="true">
            {copy.departure}
          </span>

          <ol className="fp-list" ref={listRef}>
            {STOPS.map((stop, index) => (
              <StopRow
                key={stop.id}
                stop={stop}
                index={index}
                lang={lang}
                copy={copy}
                reduced={Boolean(reduced)}
                t={t}
                registerDot={(node) => {
                  dotsRef.current[index] = node;
                }}
              />
            ))}
          </ol>

          <motion.div
            className="fp-arrival"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="fp-arrival-mark" aria-hidden="true" />
            <div className="fp-arrival-card">
              <div className="fp-arrival-copy">
                <strong>{copy.arrival}</strong>
                <p>{copy.arrivalLine}</p>
              </div>
              <Link
                href="/contact"
                className="fp-arrival-cta"
                onClick={() =>
                  trackEvent("contact_cta_click", { location: "flight_path" })
                }
              >
                {copy.arrivalCta}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{STYLES}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* One stop                                                            */
/* ------------------------------------------------------------------ */

function StopRow({
  stop,
  index,
  lang,
  copy,
  reduced,
  t,
  registerDot,
}: {
  stop: Stop;
  index: number;
  lang: "ar" | "en";
  copy: (typeof COPY)["ar"];
  reduced: boolean;
  t: ReturnType<typeof useLanguage>["t"];
  registerDot: (node: HTMLSpanElement | null) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  /* Emphasis follows the reader: a stop is "active" while it owns the middle
     band of the viewport, which is also what the travelling plane is passing. */
  const active = useInView(ref, { amount: 0.35, margin: "-22% 0px -30% 0px" });
  const AnchorIcon = stop.anchor === "trophy" ? LuTrophy : LuSparkles;

  return (
    <motion.li
      ref={ref}
      className="fp-stop"
      data-active={active ? "1" : "0"}
      data-kind={stop.year ? "role" : "interlude"}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduced ? { duration: 0 } : { duration: 0.66, ease: EASE }}
    >
      <span className="fp-year" aria-hidden="true">
        {stop.year ?? <AnchorIcon size={17} />}
      </span>

      <span className="fp-node" aria-hidden="true">
        <motion.span
          ref={registerDot}
          className="fp-dot"
          initial={{ scale: 0.2, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 20, delay: 0.08 }
          }
        />
      </span>

      <div className="fp-body">
        <div className="fp-org-row">
          {stop.logo && (
            <span className="fp-logo" data-fit={stop.logoFit ?? "contain"}>
              <Image src={stop.logo} alt="" fill sizes="48px" />
            </span>
          )}
          <h3 className="fp-org">
            {stop.org[lang]}
            {stop.current && <em className="fp-now">{copy.now}</em>}
          </h3>
        </div>

        <p className="fp-role">{stop.role[lang]}</p>
        <p className="fp-period">{stop.period[lang]}</p>
        <p className="fp-summary">{stop.summary[lang]}</p>

        {stop.metrics && (
          <div className="fp-metrics">
            {stop.metrics.map((metric) => (
              <MetricCounter
                key={metric.value + metric.label.en}
                metric={metric}
                lang={lang}
                reduced={reduced}
              />
            ))}
          </div>
        )}

        {stop.badges && (
          <ul className="fp-badges">
            {stop.badges.map((badge) => {
              const Icon = BADGE_ICON[badge.icon];
              return (
                <li key={badge.text.en} className="fp-badge">
                  <Icon size={13} />
                  {badge.text[lang]}
                </li>
              );
            })}
          </ul>
        )}

        {stop.highlights && (
          <ul className="fp-highlights">
            {stop.highlights.map((item) => (
              <li key={item.en}>{item[lang]}</li>
            ))}
          </ul>
        )}

        {stop.proof && (
          <div
            className="fp-proofs"
            data-count={Math.min(stop.proof.length, 3)}
            style={{ "--fp-ar": String(stop.ratio ?? 1.6) } as CSSProperties}
          >
            {stop.proof.map((proof, proofIndex) => (
              <ProofCard
                key={proof.src}
                proof={proof}
                lang={lang}
                reduced={reduced}
                index={proofIndex}
                stopIndex={index}
              />
            ))}
          </div>
        )}

        {stop.tags && (
          <ul className="fp-tags">
            {stop.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        {stop.credentials && (
          <div className="fp-credentials">
            <span className="fp-cred-label">{copy.credentialsLabel}</span>
            <div className="fp-cred-row">
              <CredentialChip
                index={0}
                href="https://play.google.com/store/apps/details?id=sme.bc.monshaat&hl=ar"
                title={t.hero.monshaatTitle}
                body={t.hero.monshaatBody}
                tag={t.hero.monshaatTag}
                reduced={reduced}
                medallion={
                  <span className="fp-cred-logo">
                    <Image src="/monshaat.jpg" alt="" fill sizes="42px" />
                  </span>
                }
              />
              <CredentialChip
                index={1}
                href="https://learn.ihashplus.com/teacher"
                title={t.hero.ihashTitle}
                body={t.hero.ihashBody}
                tag={t.hero.ihashTag}
                reduced={reduced}
                medallion={
                  <span className="fp-cred-logo fp-cred-logo-mark">
                    <LuGraduationCap size={18} />
                  </span>
                }
              />
            </div>
          </div>
        )}

        {stop.link &&
          (stop.link.external ? (
            <a
              className="fp-link"
              href={stop.link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("flight_path_link_click", { stop: stop.id })
              }
            >
              {stop.link.label[lang]}
              <span className="fp-link-arrow" aria-hidden="true" />
            </a>
          ) : (
            <Link
              className="fp-link"
              href={stop.link.href}
              onClick={() =>
                trackEvent("flight_path_link_click", { stop: stop.id })
              }
            >
              {stop.link.label[lang]}
              <span className="fp-link-arrow" aria-hidden="true" />
            </Link>
          ))}
      </div>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* Proof card — the same frame language as the floating hero cards      */
/* ------------------------------------------------------------------ */

function ProofCard({
  proof,
  lang,
  reduced,
  index,
  stopIndex,
}: {
  proof: Proof;
  lang: "ar" | "en";
  reduced: boolean;
  index: number;
  stopIndex: number;
}) {
  const body = (
    <>
      <span className="fp-proof-frame">
        <Image
          src={proof.src}
          alt={`${proof.label[lang]} — ${proof.meta[lang]}`}
          fill
          sizes="(max-width: 760px) 88vw, (max-width: 1080px) 44vw, 300px"
          style={proof.pos ? { objectPosition: proof.pos } : undefined}
        />
        <span className="fp-proof-sheen" aria-hidden="true" />
      </span>
      <span className="fp-proof-copy">
        <strong>{proof.label[lang]}</strong>
        <span>{proof.meta[lang]}</span>
      </span>
    </>
  );

  return (
    <motion.div
      className="fp-proof"
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              duration: 0.62,
              ease: EASE,
              delay: Math.min(index * 0.08 + (stopIndex % 2) * 0.02, 0.3),
            }
      }
    >
      {proof.href ? (
        <a
          className="fp-proof-inner"
          href={proof.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      ) : (
        <div className="fp-proof-inner">{body}</div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Impact counter                                                      */
/* ------------------------------------------------------------------ */

/** Splits "+150%" / "1,000+" into prefix, number and suffix so the number can
    count while the punctuation stays put. */
function parseMetric(value: string) {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const numeric = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return { prefix: match[1], target: numeric, suffix: match[3], grouped: match[2].includes(",") };
}

function MetricCounter({
  metric,
  lang,
  reduced,
}: {
  metric: Metric;
  lang: "ar" | "en";
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const parsed = useMemo(() => parseMetric(metric.value), [metric.value]);

  return (
    <div className="fp-metric" ref={ref}>
      <CountUp
        parsed={parsed}
        final={metric.value}
        run={inView && !reduced && Boolean(parsed)}
      />
      <span className="fp-metric-label">{metric.label[lang]}</span>
    </div>
  );
}

/** Counts the number up while the punctuation around it stays put. */
function CountUp({
  parsed,
  final,
  run,
}: {
  parsed: ReturnType<typeof parseMetric>;
  final: string;
  run: boolean;
}) {
  /* Starts on the finished value: that is what the server renders, what a
     reduced-motion or scripted-off visitor keeps, and what the first frame of
     the count immediately replaces with zero when the animation does run. */
  const [shown, setShown] = useState(final);

  useEffect(() => {
    if (!run || !parsed) return;
    let frame = 0;
    const start = performance.now();
    const duration = 950;
    const tick = (now: number) => {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      const current = Math.round(parsed.target * eased);
      setShown(
        `${parsed.prefix}${
          parsed.grouped ? current.toLocaleString("en-US") : current
        }${parsed.suffix}`,
      );
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, parsed]);

  return (
    <>
      {/* The animated read-out is decorative; assistive tech gets the final
          value in one piece. */}
      <b aria-hidden="true">{shown}</b>
      <span className="fp-sr">{final}</span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Credential chip                                                     */
/* ------------------------------------------------------------------ */

function CredentialChip({
  index,
  href,
  title,
  body,
  tag,
  medallion,
  reduced,
}: {
  index: number;
  href: string;
  title: string;
  body: string;
  tag: string;
  medallion: ReactNode;
  reduced: boolean;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`fp-cred fp-cred-${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.55, ease: EASE, delay: index * 0.08 }
      }
      onClick={() => trackEvent("credential_card_click", { href })}
    >
      <span className="fp-cred-medallion">{medallion}</span>
      <span className="fp-cred-copy">
        <strong>
          {title}
          <LuBadgeCheck size={13} aria-hidden="true" />
        </strong>
        <span className="fp-cred-tag">{tag}</span>
        <span className="fp-cred-body">{body}</span>
      </span>
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/* Route entry — the hero's line curving onto the rail                 */
/* ------------------------------------------------------------------ */

function RouteEntry({ railX, reduced }: { railX: number; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.98", "end 0.55"],
  });
  const draw = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const sync = () => setWidth(node.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const height = 118;
  const startX = width / 2;
  const endX = railX || startX;
  const ready = width > 0 && railX > 0;

  return (
    <div className="fp-entry" ref={ref} aria-hidden="true">
      {ready && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
          <defs>
            <linearGradient id="fp-entry-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--fp-line)" stopOpacity="0" />
              <stop offset="45%" stopColor="var(--fp-line)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--fp-line)" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d={`M ${startX} 0 C ${startX} ${height * 0.55}, ${endX} ${height * 0.45}, ${endX} ${height}`}
            stroke="url(#fp-entry-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {!reduced && (
            <motion.path
              d={`M ${startX} 0 C ${startX} ${height * 0.55}, ${endX} ${height * 0.45}, ${endX} ${height}`}
              stroke="var(--fp-accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ pathLength: draw, opacity: 0.9 }}
            />
          )}
        </svg>
      )}
    </div>
  );
}

/* A paper plane pointing along the route — down the page. */
function PlaneGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* Two halves with a deep centre crease: at 16px a shallow notch reads as
          a plain arrowhead, this reads as a folded paper plane. */}
      <path d="M12 22.4 2.5 3.6a.6.6 0 0 1 .82-.8L12 10.6V22.4Z" opacity=".5" />
      <path d="M12 22.4 21.5 3.6a.6.6 0 0 0-.82-.8L12 10.6V22.4Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const STYLES = `
  .fp {
    --fp-year-w: clamp(66px, 7vw, 96px);
    --fp-node-w: 36px;
    --fp-gap: clamp(14px, 1.7vw, 24px);
    --fp-line: rgba(0,0,0,.10);
    --fp-accent: #1e8fff;
    --fp-accent-soft: rgba(30,143,255,.14);
    --fp-card: rgba(255,255,255,.74);
    --fp-card-border: rgba(0,0,0,.075);
    --fp-card-shadow: 0 18px 40px rgba(15,23,42,.09), 0 2px 8px rgba(15,23,42,.05);
    --fp-dot-color: rgba(0,0,0,.075);
    position: relative;
    width: 100%;
    max-width: 100vw;
    overflow-x: clip;
    padding: 0 0 clamp(80px, 9vw, 132px);
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #0d0e12);
  }

  [data-theme="dark"] .fp {
    --fp-line: rgba(255,255,255,.12);
    --fp-accent: #46a7ff;
    --fp-accent-soft: rgba(70,167,255,.18);
    --fp-card: rgba(24,27,33,.66);
    --fp-card-border: rgba(255,255,255,.09);
    --fp-card-shadow: 0 20px 46px rgba(0,0,0,.44), 0 2px 8px rgba(0,0,0,.3);
    --fp-dot-color: rgba(255,255,255,.06);
  }

  .fp-field { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

  .fp-dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, var(--fp-dot-color) 1px, transparent 1.55px);
    background-size: 27px 27px;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 34%, transparent 72%, #000 100%);
    mask-image: linear-gradient(to bottom, #000 0%, transparent 34%, transparent 72%, #000 100%);
  }

  .fp-glow {
    position: absolute;
    inset-inline-start: -8%;
    top: 18%;
    width: 46vw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #55a9ff;
    filter: blur(130px);
    opacity: .07;
  }

  .fp-inner {
    position: relative;
    width: min(1080px, calc(100% - 36px));
    margin: 0 auto;
  }

  /* ── entry curve ─────────────────────────────────────── */

  .fp-entry { position: relative; width: 100%; height: 118px; }
  .fp-entry svg { display: block; overflow: visible; }

  /* ── header ──────────────────────────────────────────── */

  .fp-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-block: clamp(18px, 3vw, 34px) clamp(34px, 5vw, 62px);
    max-width: 760px;
  }

  .fp-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px;
    border-radius: 999px;
    background: var(--bg-pill, #f1f1f1);
    color: var(--text-secondary, #626262);
    font-size: 12.5px;
    font-weight: 700;
  }

  .fp-kicker svg { color: var(--fp-accent); }

  .fp-title {
    margin: 0;
    font-size: clamp(32px, 4.4vw, 58px);
    font-weight: 850;
    line-height: 1.06;
    letter-spacing: -.042em;
    text-wrap: balance;
  }

  [dir="rtl"] .fp-title { letter-spacing: 0; line-height: 1.24; }

  .fp-lede {
    margin: 4px 0 0;
    max-width: 62ch;
    color: var(--text-secondary, #626262);
    font-size: clamp(14.5px, 1.2vw, 17.5px);
    line-height: 1.62;
  }

  .fp-span { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }

  .fp-span-chip {
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--fp-card-border);
    background: var(--fp-card);
    color: var(--text-secondary, #626262);
    font-size: 12px;
    font-weight: 700;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .fp-span-chip-alt { color: var(--fp-accent); border-color: var(--fp-accent-soft); }

  /* ── route + rail ────────────────────────────────────── */

  .fp-route { position: relative; }

  .fp-rail {
    position: absolute;
    inset-inline-start: calc(var(--fp-year-w) + var(--fp-gap) + var(--fp-node-w) / 2);
    width: 2px;
    margin-inline-start: -1px;
    pointer-events: none;
  }

  .fp-rail-base,
  .fp-rail-fill {
    position: absolute;
    inset: 0;
    border-radius: 2px;
  }

  .fp-rail-base { background: var(--fp-line); }

  .fp-rail-fill {
    background: linear-gradient(to bottom, var(--fp-accent), rgba(30,143,255,.55));
    transform-origin: top;
    will-change: transform;
  }

  .fp-plane {
    position: absolute;
    inset-inline-start: 50%;
    top: 0;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    margin-inline-start: -14px;
    margin-top: -14px;
    border-radius: 50%;
    background: var(--bg-primary, #fff);
    border: 1px solid var(--fp-accent-soft);
    color: var(--fp-accent);
    box-shadow: 0 6px 18px rgba(30,143,255,.28);
    will-change: transform;
  }

  .fp-plane-wake {
    position: absolute;
    inset-inline-start: 50%;
    bottom: 100%;
    width: 2px;
    height: 46px;
    margin-inline-start: -1px;
    background: linear-gradient(to top, var(--fp-accent), transparent);
    opacity: .5;
  }

  .fp-cap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-inline-start: calc(var(--fp-year-w) + var(--fp-gap) + var(--fp-node-w) + var(--fp-gap));
    margin-bottom: 14px;
    color: var(--text-muted, #888);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  [dir="rtl"] .fp-cap { letter-spacing: 0; text-transform: none; font-size: 12.5px; }

  .fp-cap::before {
    content: "";
    width: 18px;
    height: 1px;
    background: var(--fp-line);
  }

  /* ── one stop ────────────────────────────────────────── */

  .fp-list { list-style: none; margin: 0; padding: 0; }

  .fp-stop {
    display: grid;
    grid-template-columns: var(--fp-year-w) var(--fp-node-w) minmax(0, 1fr);
    column-gap: var(--fp-gap);
    padding-bottom: clamp(46px, 5.6vw, 82px);
  }

  .fp-stop:last-child { padding-bottom: clamp(30px, 3.4vw, 48px); }

  .fp-year {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-top: 2px;
    color: var(--text-muted, #888);
    font-size: clamp(15px, 1.5vw, 19px);
    font-weight: 800;
    letter-spacing: -.02em;
    font-variant-numeric: tabular-nums;
    transition: color 320ms ease;
  }

  .fp-stop[data-active="1"] .fp-year { color: var(--fp-accent); }

  .fp-node { position: relative; display: flex; justify-content: center; padding-top: 5px; }

  .fp-dot {
    position: relative;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--bg-primary, #fff);
    border: 2px solid var(--fp-line);
    transition: border-color 320ms ease, box-shadow 320ms ease, transform 320ms cubic-bezier(.16,1,.3,1);
  }

  .fp-stop[data-active="1"] .fp-dot {
    border-color: var(--fp-accent);
    box-shadow: 0 0 0 5px var(--fp-accent-soft);
    transform: scale(1.12);
  }

  .fp-stop[data-kind="interlude"] .fp-dot {
    width: 9px;
    height: 9px;
    margin-top: 2px;
  }

  .fp-body { min-width: 0; max-width: 880px; padding-top: 0; }

  .fp-org-row { display: flex; align-items: center; gap: 11px; }

  .fp-logo {
    position: relative;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 13px;
    background: #fff;
    border: 1px solid var(--fp-card-border);
    box-shadow: 0 6px 16px rgba(15,23,42,.08);
  }

  [data-theme="dark"] .fp-logo { background: rgba(255,255,255,.94); }

  .fp-logo img { object-fit: contain; }
  .fp-logo[data-fit="cover"] img { object-fit: cover; }
  .fp-logo[data-fit="contain"] img { padding: 6px; }

  .fp-org {
    margin: 0;
    font-size: clamp(19px, 1.9vw, 25px);
    font-weight: 820;
    line-height: 1.2;
    letter-spacing: -.03em;
    text-wrap: balance;
  }

  [dir="rtl"] .fp-org { letter-spacing: 0; }

  .fp-now {
    display: inline-block;
    margin-inline-start: 9px;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--fp-accent-soft);
    color: var(--fp-accent);
    font-size: 10.5px;
    font-style: normal;
    font-weight: 800;
    letter-spacing: .04em;
    text-transform: uppercase;
    vertical-align: middle;
  }

  [dir="rtl"] .fp-now { letter-spacing: 0; text-transform: none; font-size: 11.5px; }

  .fp-role {
    margin: 9px 0 0;
    color: var(--text-primary, #0d0e12);
    font-size: 14.5px;
    font-weight: 700;
  }

  .fp-period {
    margin: 3px 0 0;
    color: var(--text-muted, #888);
    font-size: 12.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .fp-summary {
    margin: 11px 0 0;
    max-width: 60ch;
    color: var(--text-secondary, #626262);
    font-size: 14.5px;
    line-height: 1.68;
  }

  /* ── counters ────────────────────────────────────────── */

  .fp-metrics { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }

  .fp-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 15px;
    border-radius: 14px;
    background: var(--fp-card);
    border: 1px solid var(--fp-card-border);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .fp-metric b {
    color: var(--text-primary, #0d0e12);
    font-size: 20px;
    font-weight: 850;
    letter-spacing: -.035em;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .fp-metric-label {
    color: var(--text-muted, #888);
    font-size: 11.5px;
    font-weight: 620;
  }

  .fp-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── badges, highlights, tags ────────────────────────── */

  .fp-badges,
  .fp-highlights,
  .fp-tags { list-style: none; margin: 16px 0 0; padding: 0; }

  .fp-badges { display: flex; flex-wrap: wrap; gap: 8px; }

  .fp-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    border-radius: 999px;
    background: var(--fp-card);
    border: 1px solid var(--fp-card-border);
    color: var(--text-primary, #0d0e12);
    font-size: 12.5px;
    font-weight: 700;
  }

  .fp-badge svg { color: #d9a441; flex: 0 0 auto; }

  .fp-highlights {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 22px;
    max-width: 660px;
  }

  .fp-highlights li {
    position: relative;
    padding-inline-start: 17px;
    color: var(--text-secondary, #626262);
    font-size: 13.5px;
    line-height: 1.55;
  }

  .fp-highlights li::before {
    content: "";
    position: absolute;
    inset-inline-start: 2px;
    top: .62em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--fp-accent);
    opacity: .8;
  }

  .fp-tags { display: flex; flex-wrap: wrap; gap: 6px; }

  .fp-tags li {
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--bg-pill, #f1f1f1);
    color: var(--text-muted, #888);
    font-size: 11.5px;
    font-weight: 680;
  }

  /* ── proof cards ─────────────────────────────────────── */

  /* A lone card carries the stop on its own, so it is given more presence;
     a row of three is read as a set and each one stays compact. */
  .fp-proofs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(0, 268px));
    justify-content: start;
    gap: 14px;
    margin-top: 20px;
  }

  .fp-proofs[data-count="1"] { grid-template-columns: minmax(0, 384px); }
  .fp-proofs[data-count="2"] { grid-template-columns: repeat(2, minmax(0, 300px)); }

  .fp-proof { min-width: 0; }

  .fp-proof-inner {
    display: block;
    text-decoration: none;
    color: inherit;
    padding: 9px 9px 12px;
    border-radius: 20px;
    background: var(--fp-card);
    border: 1px solid var(--fp-card-border);
    box-shadow: var(--fp-card-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: transform 340ms cubic-bezier(.16,1,.3,1), box-shadow 340ms ease;
  }

  a.fp-proof-inner:hover,
  a.fp-proof-inner:focus-visible {
    transform: translateY(-4px);
    box-shadow: 0 26px 54px rgba(15,23,42,.14);
  }

  .fp-proof-frame {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: var(--fp-ar, 1.6);
    overflow: hidden;
    border-radius: 13px;
    background: var(--bg-card, #f3f3f3);
    border: 1px solid var(--fp-card-border);
  }

  .fp-proof-frame img { object-fit: cover; }

  .fp-proof-sheen {
    position: absolute;
    inset: 0;
    background: linear-gradient(168deg, rgba(255,255,255,.24) 0%, rgba(255,255,255,0) 46%);
    pointer-events: none;
  }

  [data-theme="dark"] .fp-proof-sheen {
    background: linear-gradient(168deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 46%);
  }

  .fp-proof-copy { display: block; padding: 11px 5px 0; }

  .fp-proof-copy strong {
    display: block;
    font-size: 13.5px;
    font-weight: 800;
    letter-spacing: -.02em;
    line-height: 1.3;
  }

  [dir="rtl"] .fp-proof-copy strong { letter-spacing: 0; }

  .fp-proof-copy span {
    display: block;
    margin-top: 3px;
    color: var(--text-muted, #888);
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.4;
  }

  /* ── credentials ─────────────────────────────────────── */

  .fp-credentials { margin-top: 22px; }

  .fp-cred-label {
    display: block;
    margin-bottom: 10px;
    color: var(--text-muted, #888);
    font-size: 11px;
    font-weight: 760;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  [dir="rtl"] .fp-cred-label { letter-spacing: 0; text-transform: none; font-size: 12px; }

  .fp-cred-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(0, 300px));
    justify-content: start;
    gap: 12px;
  }

  .fp-cred {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    text-decoration: none;
    color: inherit;
    background: var(--fp-card);
    border: 1px solid var(--fp-card-border);
    box-shadow: var(--fp-card-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: transform 320ms cubic-bezier(.16,1,.3,1), box-shadow 320ms ease;
  }

  .fp-cred:hover,
  .fp-cred:focus-visible { transform: translateY(-3px); }

  .fp-cred-medallion { flex: 0 0 auto; }

  .fp-cred-logo {
    position: relative;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    overflow: hidden;
    border-radius: 12px;
    background: #fff;
    border: 1px solid var(--fp-card-border);
  }

  .fp-cred-logo img { object-fit: cover; }

  .fp-cred-logo-mark { background: var(--fp-accent-soft); color: var(--fp-accent); }

  .fp-cred-copy { display: flex; flex-direction: column; min-width: 0; }

  .fp-cred-copy strong {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 800;
    letter-spacing: -.02em;
  }

  [dir="rtl"] .fp-cred-copy strong { letter-spacing: 0; }
  .fp-cred-copy strong svg { color: var(--fp-accent); flex: 0 0 auto; }

  .fp-cred-tag {
    margin-top: 3px;
    color: var(--fp-accent);
    font-size: 11.5px;
    font-weight: 700;
  }

  .fp-cred-body {
    margin-top: 7px;
    color: var(--text-secondary, #626262);
    font-size: 12.5px;
    line-height: 1.55;
  }

  /* ── link ────────────────────────────────────────────── */

  .fp-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 18px;
    padding: 10px 17px;
    border-radius: 999px;
    background: var(--text-primary, #0d0e12);
    color: var(--bg-primary, #fff);
    font-size: 13px;
    font-weight: 760;
    text-decoration: none;
    transition: transform 280ms cubic-bezier(.16,1,.3,1), box-shadow 280ms ease;
  }

  .fp-link:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,0,0,.18); }

  .fp-link-arrow {
    width: 13px;
    height: 1.5px;
    background: currentColor;
    position: relative;
  }

  .fp-link-arrow::after {
    content: "";
    position: absolute;
    inset-inline-end: 0;
    top: -3px;
    width: 7px;
    height: 7px;
    border-top: 1.5px solid currentColor;
    border-inline-end: 1.5px solid currentColor;
    transform: rotate(45deg);
  }

  [dir="rtl"] .fp-link-arrow::after { transform: rotate(-135deg); top: -3px; }

  /* ── arrival ─────────────────────────────────────────── */

  .fp-arrival {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 18px;
    margin-inline-start: calc(var(--fp-year-w) + var(--fp-gap));
  }

  .fp-arrival-card {
    flex: 1 1 320px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 18px;
    max-width: 880px;
    padding: 22px 24px;
    border-radius: 22px;
    background: var(--fp-card);
    border: 1px solid var(--fp-card-border);
    box-shadow: var(--fp-card-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .fp-arrival-mark {
    flex: 0 0 auto;
    width: var(--fp-node-w);
    display: block;
    height: 13px;
    position: relative;
  }

  .fp-arrival-mark::before {
    content: "";
    position: absolute;
    inset-inline-start: 50%;
    top: 0;
    width: 13px;
    height: 13px;
    margin-inline-start: -6.5px;
    border-radius: 50%;
    background: var(--fp-accent);
    box-shadow: 0 0 0 5px var(--fp-accent-soft);
  }

  .fp-arrival-copy { min-width: 0; flex: 1 1 240px; }

  .fp-arrival-copy strong {
    display: block;
    font-size: clamp(19px, 1.8vw, 24px);
    font-weight: 840;
    letter-spacing: -.03em;
  }

  [dir="rtl"] .fp-arrival-copy strong { letter-spacing: 0; }

  .fp-arrival-copy p {
    margin: 5px 0 0;
    color: var(--text-secondary, #626262);
    font-size: 14px;
    line-height: 1.6;
  }

  .fp-arrival-cta {
    display: inline-flex;
    align-items: center;
    min-height: 46px;
    padding: 12px 26px;
    border-radius: 999px;
    background: var(--text-primary, #0d0e12);
    color: var(--bg-primary, #fff);
    font-size: 14px;
    font-weight: 780;
    text-decoration: none;
    box-shadow: 0 13px 30px rgba(0,0,0,.16);
    transition: transform 280ms cubic-bezier(.16,1,.3,1), box-shadow 280ms ease;
  }

  .fp-arrival-cta:hover { transform: translateY(-2px); box-shadow: 0 18px 38px rgba(0,0,0,.2); }

  /* ── tablet ──────────────────────────────────────────── */

  @media (max-width: 900px) {
    .fp { --fp-year-w: clamp(54px, 8vw, 74px); --fp-node-w: 30px; }
    .fp-entry { height: 92px; }
    .fp-proofs,
    .fp-proofs[data-count="1"],
    .fp-proofs[data-count="2"] {
      grid-template-columns: repeat(auto-fill, minmax(0, 244px));
    }
    .fp-highlights { grid-template-columns: 1fr; }
  }

  /* ── mobile: one clean column ────────────────────────── */

  @media (max-width: 640px) {
    .fp { --fp-year-w: 0px; --fp-node-w: 22px; --fp-gap: 12px; }

    .fp-inner { width: calc(100% - 30px); }

    .fp-entry { height: 74px; }

    .fp-stop { grid-template-columns: var(--fp-node-w) minmax(0, 1fr); }

    .fp-year { display: none; }

    .fp-rail { inset-inline-start: calc(var(--fp-node-w) / 2); }

    .fp-cap { margin-inline-start: calc(var(--fp-node-w) + var(--fp-gap)); }

    .fp-arrival {
      margin-inline-start: 0;
      gap: 12px;
    }

    .fp-arrival-card { padding: 18px; gap: 14px; }
    .fp-highlights { grid-template-columns: 1fr; }
    .fp-proofs,
    .fp-proofs[data-count="1"],
    .fp-proofs[data-count="2"] { grid-template-columns: 1fr; }
    .fp-cred-row { grid-template-columns: 1fr; }

    .fp-arrival-mark { width: var(--fp-node-w); }

    .fp-org { font-size: 20px; }
    .fp-summary, .fp-role { font-size: 14px; }
    .fp-proofs { grid-template-columns: 1fr; gap: 12px; }
    .fp-highlights { grid-template-columns: 1fr; }
    .fp-metric { padding: 9px 13px; }
    .fp-metric b { font-size: 18px; }
    .fp-arrival-cta { width: 100%; justify-content: center; }
  }

  /* ── reduced motion ──────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    /* A framer \`initial\` has already been written into the markup by the time
       the client knows the preference, so the resting state is restored here
       instead: everything is simply visible, in place, with the route drawn. */
    .fp-head,
    .fp-stop,
    .fp-dot,
    .fp-proof,
    .fp-cred,
    .fp-arrival {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }

    .fp-plane { display: none; }
    .fp-rail-fill { transform: scaleY(1) !important; }
    .fp-entry svg path { opacity: 1 !important; }
    .fp-proof-inner,
    .fp-cred,
    .fp-link,
    .fp-arrival-cta,
    .fp-dot { transition: none !important; }
  }
`;
