/**
 * Design-system hook: matches a breakpoint (min-width). Uses tokens/breakpoints.
 */
import { useState, useEffect } from "react";
import { BREAKPOINT_PX } from "../tokens/breakpoints";

export type BreakpointKey = keyof typeof BREAKPOINT_PX;

export function useBreakpoint(key: BreakpointKey): boolean {
  const px = BREAKPOINT_PX[key];
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${px}px)`).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [px]);

  return matches;
}
