"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent, type MotionValue } from "framer-motion";

/** Piecewise-linear sample of `stops → out`, clamped at both ends. */
export function sample(v: number, stops: number[], out: number[], ease?: (t: number) => number) {
  const last = stops.length - 1;
  if (v <= stops[0]) return out[0];
  if (v >= stops[last]) return out[last];
  for (let i = 1; i <= last; i++) {
    if (v <= stops[i]) {
      let t = (v - stops[i - 1]) / (stops[i] - stops[i - 1]);
      if (ease) t = ease(t);
      return out[i - 1] + (out[i] - out[i - 1]) * t;
    }
  }
  return out[last];
}

/**
 * Scroll-scrubbed value written straight into a MotionValue.
 * `useTransform` is used for transform channels, but its derived values never
 * reach `opacity` in this tree — this drives those channels explicitly.
 */
export function useScrub(
  p: MotionValue<number>,
  stops: number[],
  out: number[],
  ease?: (t: number) => number,
) {
  const mv = useMotionValue(sample(p.get(), stops, out, ease));
  const spec = useRef({ stops, out, ease });
  useEffect(() => {
    spec.current = { stops, out, ease };
    mv.set(sample(p.get(), stops, out, ease));
  });
  useMotionValueEvent(p, "change", (v) =>
    mv.set(sample(v, spec.current.stops, spec.current.out, spec.current.ease)),
  );
  return mv;
}

/** Normalized 0→1 progress across a window of a parent progress value. */
export function useWindow(p: MotionValue<number>, from: number, to: number) {
  return useScrub(p, [from, to], [0, 1]);
}
