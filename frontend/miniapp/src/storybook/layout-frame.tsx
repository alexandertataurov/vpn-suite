import type { CSSProperties, ReactNode } from "react";

export function MobileFrame({
  children,
  width = 390,
  minHeight = 844,
}: {
  children: ReactNode;
  width?: number;
  minHeight?: number;
}) {
  const frameStyle: CSSProperties = {
    "--app-height": `${minHeight}px`,
    width: "100%",
    maxWidth: width,
    minWidth: 0,
    height: minHeight,
    border: "10px solid var(--color-border-strong)",
    borderRadius: 44,
    overflow: "hidden",
    position: "relative",
    background: "var(--color-bg)",
    boxShadow: "0 22px 56px color-mix(in oklch, var(--color-bg) 80%, transparent)",
  } as CSSProperties;

  const viewportStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    minHeight: 0,
  };

  return (
    <div style={frameStyle}>
      <div style={viewportStyle}>{children}</div>
    </div>
  );
}
