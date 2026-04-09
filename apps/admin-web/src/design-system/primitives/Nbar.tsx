/** Inline bar (nbar) — dynamic width via CSS var; keeps style in design-system. */
interface NbarProps {
  pct: number;
  variant: "blue" | "amber" | "red";
  className?: string;
}

export function Nbar({ pct, variant, className = "" }: NbarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={["nbar", className].filter(Boolean).join(" ")}
      style={{ ["--nbfill-pct" as string]: clamped }}
    >
      <div className={`nbfill nbfill--${variant}`} />
    </div>
  );
}
