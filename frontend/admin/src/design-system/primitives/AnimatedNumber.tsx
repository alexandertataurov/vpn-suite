import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  /** Number of decimal places; 0 = integers */
  decimals?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Custom formatter; overrides decimals if provided */
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.4,
  format,
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const formatter =
    format ?? (decimals > 0 ? (n) => n.toFixed(decimals) : (n) => Math.round(n).toString());

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const from = prevRef.current;
    prevRef.current = value;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
