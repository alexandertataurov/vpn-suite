import type { HTMLAttributes, ReactNode } from "react";
import { MissionCard, type MissionTone } from "../../patterns";

export interface CompactSummaryCardStat {
  label: string;
  value: ReactNode;
}

export interface CompactSummaryCardProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  stats?: readonly CompactSummaryCardStat[];
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  tone?: MissionTone;
  as?: "article" | "section" | "div";
}

export function CompactSummaryCard({
  eyebrow,
  title,
  subtitle,
  badges,
  stats,
  actions,
  footer,
  children,
  tone = "blue",
  as = "article",
  className = "",
  ...props
}: CompactSummaryCardProps) {
  return (
    <MissionCard
      as={as}
      tone={tone}
      className={["module-card", "compact-summary-card", className].filter(Boolean).join(" ")}
      {...props}
    >
      <div className="compact-summary-card__header">
        <div className="compact-summary-card__copy">
          {eyebrow ? <div className="compact-summary-card__eyebrow">{eyebrow}</div> : null}
          <div className="compact-summary-card__title-row">
            <div className="compact-summary-card__title">{title}</div>
            {badges ? <div className="compact-summary-card__badges">{badges}</div> : null}
          </div>
          {subtitle ? <div className="compact-summary-card__subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="compact-summary-card__actions">{actions}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <div className="compact-summary-card__stats" role="list">
          {stats.map((item) => (
            <div key={item.label} className="compact-summary-card__stat" role="listitem">
              <span className="compact-summary-card__stat-label">{item.label}</span>
              <span className="compact-summary-card__stat-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {children ? <div className="compact-summary-card__body">{children}</div> : null}
      {footer ? <div className="compact-summary-card__footer">{footer}</div> : null}
    </MissionCard>
  );
}
