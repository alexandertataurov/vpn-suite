import type { HTMLAttributes, ReactNode } from "react";

export type SummaryHeroEdge = "e-g" | "e-b" | "e-a" | "e-r";
export type SummaryHeroGlow = "g-green" | "g-blue" | "g-amber" | "g-red";

export interface SummaryHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Compact two-cell layout: count left, pending status right. Ignores subtitle when set. */
  pendingLabel?: string | null;
  edge?: SummaryHeroEdge;
  glow?: SummaryHeroGlow;
  children?: ReactNode;
}

/** Content Library 3d: Generic Summary Hero (e.g. Support status). */
export function SummaryHero({
  eyebrow,
  title,
  subtitle,
  pendingLabel,
  edge = "e-b",
  glow = "g-blue",
  children,
  className = "",
  ...props
}: SummaryHeroProps) {
  const useCells = pendingLabel != null && pendingLabel !== "";
  return (
    <div className={["summary-hero", edge, "stagger-1", className].filter(Boolean).join(" ")} {...props}>
      <div className={`summary-hero-glow ${glow}`} aria-hidden />
      <div className="summary-hero-body">
        {eyebrow ? <div className="card-eyebrow">{eyebrow}</div> : null}
        {useCells ? (
          <div className="devices-hero-cells">
            <div className="devices-hero-cell--count miniapp-tnum">{title}</div>
            <div className="devices-hero-cell--pending">{pendingLabel}</div>
          </div>
        ) : (
          <>
            <div className="summary-hero-title">{title}</div>
            {subtitle ? <div className="summary-hero-sub">{subtitle}</div> : null}
          </>
        )}
        {children}
      </div>
    </div>
  );
}
