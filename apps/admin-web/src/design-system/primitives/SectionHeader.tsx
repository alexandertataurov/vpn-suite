import type { ReactNode } from "react";

type SectionHeaderSize = "sm" | "md" | "lg";

interface SectionHeaderProps {
  label: string;
  note?: ReactNode;
  children?: ReactNode;
  size?: SectionHeaderSize;
}

export function SectionHeader({ label, note, children, size = "md" }: SectionHeaderProps) {
  const right = note ?? children;
  const sizeClass = size !== "md" ? `shead-${size}` : null;

  return (
    <div className={["shead", sizeClass].filter(Boolean).join(" ")}>
      <div className="shead-label">{label}</div>
      <div className="shead-line" />
      {right && <div className="shead-note">{right}</div>}
    </div>
  );
}

