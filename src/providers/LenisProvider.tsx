"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth wheel scrolling — on the devices that have a wheel.
 *
 * Lenis leaves touch alone by design: `syncTouch` is off by default, so a
 * phone's scrolling is already the browser's own, and the only thing Lenis
 * does there is what it does everywhere — hold a requestAnimationFrame loop
 * open for the life of the page and run its integrator on every single frame.
 *
 * On a desktop that is the price of the smoothing. On a phone it buys nothing
 * at all: there are no wheel events to smooth, so it is a permanent per-frame
 * task competing with the compositor for the exact frames a scroll-driven page
 * most needs — and it never idles, because the loop is unconditional.
 *
 * So coarse-pointer devices get native scrolling and no loop. Nothing about
 * how they scroll changes; there is simply no longer a second animation engine
 * running underneath the first one.
 */
export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
