// hooks/useSmoothedValue.ts
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases a numeric display value toward `target` instead of snapping to it
 * on every WebSocket tick. Backs every gauge/large-number readout in the
 * redesign — this is what makes telemetry feel "alive but calm" (brief #17)
 * rather than flickering at ~7 updates/sec.
 */
export function useSmoothedValue(target: number | undefined, factor = 0.15): number | undefined {
  const [display, setDisplay] = useState<number | undefined>(target);
  const displayRef = useRef<number | undefined>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === undefined) {
      setDisplay(undefined);
      displayRef.current = undefined;
      return;
    }
    if (displayRef.current === undefined) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const step = () => {
      const current = displayRef.current ?? target;
      const next = current + (target - current) * factor;
      const settled = Math.abs(target - next) < 0.05;
      displayRef.current = settled ? target : next;
      setDisplay(displayRef.current);
      if (!settled) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
