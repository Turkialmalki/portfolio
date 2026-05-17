"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      dotX = e.clientX;
      dotY = e.clientY;
      if (!isVisible) setIsVisible(true);
    };

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const animate = () => {
      ringX = lerp(ringX, dotX, 0.1);
      ringY = lerp(ringY, dotY, 0.1);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX - 3}px, ${dotY - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    const addHover = () => setIsHovering(true);
    const removeHover = () => setIsHovering(false);

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseleave", onMouseLeave);

    const interactables = document.querySelectorAll(
      "a, button, [data-cursor-hover]"
    );
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", addHover);
        el.removeEventListener("mouseleave", removeHover);
      });
      cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  return (
    <>
      {/* Cursor dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#ffffff",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease, width 0.3s ease, height 0.3s ease",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      />
      {/* Cursor ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9997] pointer-events-none"
        style={{
          width: isHovering ? 56 : 40,
          height: isHovering ? 56 : 40,
          borderRadius: "50%",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          opacity: isVisible ? (isHovering ? 0.6 : 0.4) : 0,
          transition:
            "opacity 0.3s ease, width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
