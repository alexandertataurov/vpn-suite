import type { ReactNode } from "react";

export function CardGrid({
  children,
  minWidth = 240,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        gap: 24,
        margin: "24px 0",
      }}
    >
      {children}
    </div>
  );
}
