"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  SiFigma,
  SiFramer,
  SiGithub,
  SiJavascript,
  SiMetabase,
  SiDynatrace,
  SiNextdotjs,
  SiReact,
  SiRedux,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { TbBrandReactNative } from "react-icons/tb";
import { LuSparkles } from "react-icons/lu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSafeReducedMotion } from "@/hooks/useSafeReducedMotion";

type Tool = { name: string; Icon?: IconType; color?: string; mono?: string };

/* Only tools this site's own timeline and case studies already name — nothing
   added for show. Brand colours are the marks' own; the two black ones follow
   the theme instead so they stay visible in dark mode. */
const TOOLS: Tool[] = [
  { name: "React", Icon: SiReact, color: "#61DAFB" },
  { name: "React Native", Icon: TbBrandReactNative, color: "#61DAFB" },
  { name: "Next.js", Icon: SiNextdotjs },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
  { name: "JavaScript", Icon: SiJavascript, color: "#F7DF1E" },
  { name: "Redux", Icon: SiRedux, color: "#764ABC" },
  { name: "Tailwind", Icon: SiTailwindcss, color: "#38BDF8" },
  { name: "Framer", Icon: SiFramer },
  { name: "Figma", Icon: SiFigma, color: "#F24E1E" },
  { name: "Supabase", Icon: SiSupabase, color: "#3ECF8E" },
  { name: "Metabase", Icon: SiMetabase, color: "#509EE3" },
  { name: "NoCoDB", mono: "N", color: "#2B50FB" },
  { name: "Dynatrace", Icon: SiDynatrace, color: "#1496FF" },
  { name: "Countly", mono: "C", color: "#2FA862" },
  { name: "GitHub", Icon: SiGithub },
  { name: "AI tools", Icon: LuSparkles, color: "#A78BFA" },
];

const COPY = {
  ar: { kicker: "", title: "الأدوات", done: "كلها في مكان واحد." },
  en: { kicker: "", title: "Tools", done: "All in one place." },
} as const;

/* deterministic scatter: same positions on server and client, no Math.random */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Stack() {
  const { lang, t } = useLanguage();
  const copy = COPY[lang];
  const reduced = useSafeReducedMotion();
  const rtl = t.dir === "rtl";

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  const scatter = useMemo(
    () =>
      TOOLS.map((_, i) => ({
        x: (hash(i + 1) - 0.5) * 2,
        y: (hash(i + 41) - 0.5) * 2,
        r: (hash(i + 83) - 0.5) * 70,
        s: 0.7 + hash(i + 127) * 0.7,
      })),
    [],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || reduced) return;

    let w = 0;
    let h = 0;
    let top = 0;
    let span = 1;
    let size = 72;
    let gap = 12;
    let cols = 4;
    let mid = 0; // vertical centre of the free band between heading and caption, from stage centre

    const measure = () => {
      w = stage.clientWidth;
      h = stage.clientHeight;
      top = root.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, root.offsetHeight - h);
      cols = w >= 900 ? 8 : 4;
      gap = w >= 900 ? 16 : 10;
      size = Math.min(w >= 900 ? 96 : 84, Math.floor((w - 32 - gap * (cols - 1)) / cols));

      /* the grid lives in the band between the heading and the closing line, so
         a short phone shrinks the tiles instead of letting them overlap either */
      const head = headRef.current;
      const bandTop = (head ? head.offsetTop + head.offsetHeight : 0) + 20;
      const bandBottom = h - 92;
      const rows = Math.ceil(TOOLS.length / cols);
      size = Math.max(40, Math.min(size, Math.floor((bandBottom - bandTop) / rows - gap - 20)));
      mid = (bandTop + bandBottom) / 2 - h / 2;
    };

    const render = () => {
      const p = clamp01((window.scrollY - top) / span);
      const g = clamp01(p / 0.72);
      const rows = Math.ceil(TOOLS.length / cols);
      const rowH = size + gap + 20;
      const dir = rtl ? -1 : 1;

      for (let i = 0; i < TOOLS.length; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;
        const c = i % cols;
        const r = Math.floor(i / cols);
        const tx = (c - (cols - 1) / 2) * (size + gap) * dir;
        const ty = (r - (rows - 1) / 2) * rowH + mid;
        const sc = scatter[i];
        const k = ease(clamp01(g * 1.45 - (i / TOOLS.length) * 0.45));
        const x = lerp(sc.x * w * 0.46, tx, k);
        const y = lerp(sc.y * h * 0.42, ty, k);
        el.style.width = `${size}px`;
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${lerp(sc.r, 0, k).toFixed(1)}deg) scale(${lerp(sc.s, 1, k).toFixed(3)})`;
        el.style.setProperty("--lab", clamp01((k - 0.55) / 0.45).toFixed(2));
      }
      if (doneRef.current) doneRef.current.style.opacity = String(clamp01((p - 0.78) / 0.14));
    };

    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          render();
        });
    };
    const onResize = () => {
      measure();
      render();
    };
    measure();
    render();
    setReady(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, rtl, scatter]);

  return (
    <section
      id="stack"
      ref={rootRef}
      className="st-root"
      data-static={reduced ? "1" : "0"}
      data-ready={ready || reduced ? "1" : "0"}
      aria-labelledby="st-title"
    >
      <div className="st-stage" ref={stageRef}>
        <header className="st-head" ref={headRef}>
          
          <h2 id="st-title">{copy.title}</h2>
        </header>

        <div className="st-field">
          {TOOLS.map((tool, i) => (
            <div
              key={tool.name}
              className="st-tile"
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              style={{ "--c": tool.color ?? "var(--text-primary)" } as CSSProperties}
            >
              <span className="st-icon">
                {tool.Icon ? <tool.Icon size={34} aria-hidden="true" /> : <b aria-hidden="true">{tool.mono}</b>}
              </span>
              <span className="st-name">{tool.name}</span>
            </div>
          ))}
        </div>

        <p className="st-done" ref={doneRef}>
          {copy.done}
        </p>
      </div>

      <style>{`
        .st-root { position: relative; height: 270svh; background: var(--bg-primary); color: var(--text-primary); }
        @media (max-width: 700px) { .st-root:not([data-static="1"]) { height: 190svh; } }
        .st-stage { position: sticky; top: 0; height: 100svh; min-height: 560px; overflow: hidden; }
        .st-head { position: absolute; inset-inline: 0; top: clamp(84px, 13svh, 130px); text-align: center; padding: 0 20px; z-index: 2; }
        .st-kicker { font-size: 13px; font-weight: 700; letter-spacing: .08em; color: var(--accent); }
        .st-head h2 { margin: 10px 0 0; font-size: clamp(30px, 6vw, 64px); line-height: 1.1; font-weight: 900; }
        .st-field { position: absolute; inset: 0; display: grid; place-items: center; }
        .st-field > .st-tile { grid-area: 1 / 1; }
        .st-tile {
          display: flex; flex-direction: column; align-items: center; gap: 8px; will-change: transform;
          --lab: 0;
        }
        .st-root[data-ready="0"] .st-tile { opacity: 0; }
        .st-icon {
          width: 100%; aspect-ratio: 1; display: grid; place-items: center; border-radius: 24%;
          background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--c);
          box-shadow: 0 10px 28px rgba(0,0,0,.1);
        }
        .st-icon b { font-size: 30px; font-weight: 900; }
        .st-name { font-size: 12px; font-weight: 700; white-space: nowrap; color: var(--text-secondary); opacity: var(--lab); }
        .st-done { position: absolute; inset-inline: 0; bottom: 24px; text-align: center; margin: 0; padding: 0 24px; opacity: 0; color: var(--text-secondary); font-size: clamp(14px, 1.8vw, 17px); }

        /* reduced motion: no pin, no scatter — the finished grid, at rest */
        .st-root[data-static="1"] { height: auto; padding: clamp(72px, 12vw, 140px) 20px; }
        .st-root[data-static="1"] .st-stage { position: static; height: auto; min-height: 0; }
        .st-root[data-static="1"] .st-head { position: static; margin-bottom: 36px; }
        .st-root[data-static="1"] .st-field { position: static; display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
        .st-root[data-static="1"] .st-tile { width: 84px; --lab: 1; }
        .st-root[data-static="1"] .st-done { position: static; opacity: 1; margin-top: 32px; }
      `}</style>
    </section>
  );
}
