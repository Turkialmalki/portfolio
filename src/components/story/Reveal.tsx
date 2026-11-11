"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Fades a block up the first time it enters the viewport. The state lives on
 * the element (`data-in`), not in React, so a page full of these re-renders
 * nothing. Without JS or IntersectionObserver the block simply shows.
 */
export default function Reveal({
  children,
  i = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  i?: number;
  as?: "div" | "li" | "article" | "header" | "section";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "1";
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = "1";
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const T = Tag as "div";
  return (
    <T ref={ref as React.RefObject<HTMLDivElement>} className={`rv ${className}`} style={{ "--rv": i } as CSSProperties}>
      {children}
    </T>
  );
}
