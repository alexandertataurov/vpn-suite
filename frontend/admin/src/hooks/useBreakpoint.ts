import { useState, useEffect } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

const XS = 640;
const SM = 1024;
const MD = 1440;
const LG = 1920;

function getBreakpoint(width: number): Breakpoint {
  if (width >= LG) return "xl";
  if (width >= MD) return "lg";
  if (width >= SM) return "md";
  if (width >= XS) return "sm";
  return "xs";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getBreakpoint(window.innerWidth) : "md"
  );

  useEffect(() => {
    const onResize = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

export function useIsXs(): boolean {
  return useBreakpoint() === "xs";
}

export function useIsSmOrBelow(): boolean {
  const bp = useBreakpoint();
  return bp === "xs" || bp === "sm";
}
