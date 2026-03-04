import type { Decorator } from "@storybook/react";
import { createElement, useEffect, useRef, useState } from "react";

export const withMeasure: Decorator = (Story, context) => {
  if (!context.parameters?.measure) {
    return <Story />;
  }
  return createElement(MeasureWrapper, null, createElement(Story));
};

function MeasureWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "inline-block", position: "relative" }}>
      {children}
      {box && (
        <div
          style={{
            position: "absolute",
            top: -24,
            left: 0,
            fontSize: 10,
            fontFamily: "monospace",
            color: "var(--color-text-muted, #6E8499)",
            background: "var(--color-elevated, #141C24)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {box.w} × {box.h}
        </div>
      )}
    </div>
  );
}
