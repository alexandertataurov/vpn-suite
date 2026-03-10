import type { HTMLAttributes, ReactNode } from "react";
import { MissionProgressBar, type MissionHealthTone } from "@/design-system";

export type SummaryHeroEdge = "e-g" | "e-b" | "e-a" | "e-r";
export type SummaryHeroGlow = "g-green" | "g-blue" | "g-amber" | "g-red";

export interface SummaryHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pendingLabel?: string | null;
  edge?: SummaryHeroEdge;
  glow?: SummaryHeroGlow;
  metrics?: Array<{
    keyLabel: string;
    valueLabel: string;
    percent: number;
    tone?: MissionHealthTone;
  }>;
  metricStaticFill?: boolean;
  children?: ReactNode;
}

/** Content Library 3d: Generic Summary Hero. */
export function SummaryHero({
  eyebrow,
  title,
  subtitle,
  pendingLabel,
  edge = "e-b",
  glow = "g-blue",
  metrics = [],
  metricStaticFill = true,
  children,
  className = "",
  ...props
}: SummaryHeroProps) {
  const useCells = pendingLabel != null && pendingLabel !== "";
  return (
    <div className={["summary-hero", edge, className].filter(Boolean).join(" ")} {...props}>
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
        {metrics.length > 0 ? (
          <div className="hero-visual-grid" aria-label="Summary overview">
            {metrics.map((metric) => (
              <div key={metric.keyLabel} className="hero-visual-tile">
                <div className="hero-visual-topline">
                  <span className="hero-visual-key">{metric.keyLabel}</span>
                  <span className="hero-visual-value">{metric.valueLabel}</span>
                </div>
                <MissionProgressBar
                  percent={metric.percent}
                  tone={metric.tone ?? "healthy"}
                  staticFill={metricStaticFill}
                  ariaLabel={`${metric.keyLabel} ${metric.valueLabel}`}
                  className="hero-visual-progress"
                />
              </div>
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
