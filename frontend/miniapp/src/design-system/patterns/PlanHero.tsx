import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";

export type PlanHeroStatus = "active" | "expiring" | "expired";

/** Bar fill width set after mount (≥380ms) per content library constraint. */
function ExpiryFill({
  percent,
  fillClass = "ok",
}: {
  percent: number;
  fillClass?: "ok" | "warn" | "crit";
}) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t = setTimeout(() => setWidth(percent), 380);
    return () => clearTimeout(t);
  }, [percent]);
  return (
    <div
      className={`bar-fill ${fillClass}`}
      id="expiryFill"
      style={{ width: `${width}%` }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}

export interface PlanHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  planName: string;
  planSubline?: string;
  priceMain: string;
  priceSub?: string;
  period?: string;
  validUntil: string;
  expiryPercent: number;
  expiryFillClass?: "ok" | "warn" | "crit";
  planId?: string;
  devicesLabel?: string;
  protocolLabel?: string;
  onCopyPlanId?: (fullId: string) => void;
  onRenew?: () => void;
  onManage?: () => void;
  status?: PlanHeroStatus;
}

/** Content Library 3b: Active Plan Hero. */
export function PlanHero({
  planName,
  planSubline,
  priceMain,
  priceSub,
  period = "/ month",
  validUntil,
  expiryPercent,
  expiryFillClass = "ok",
  planId,
  devicesLabel,
  protocolLabel,
  onCopyPlanId,
  onRenew,
  onManage,
  status = "active",
  className = "",
  ...props
}: PlanHeroProps) {
  const statusClass = status === "expiring" ? "expiring" : status === "expired" ? "expired" : "";

  return (
    <div
      className={`plan-hero ${statusClass} stagger-1 ${className}`.trim()}
      {...props}
    >
      <div className="plan-hero-glow" aria-hidden />
      <div className="plan-hero-body">
        <div className="card-eyebrow">Current Subscription</div>
        <div className="plan-hero-header">
          <div className="plan-hero-name">
            {planName}
            {planSubline ? <span>{planSubline}</span> : null}
          </div>
          <div className="plan-hero-price">
            {priceMain}
            {priceSub != null ? <sub>.{priceSub}</sub> : null}
            <div className="plan-hero-period">{period}</div>
          </div>
        </div>
        <div className="expiry-row">
          <div className="expiry-meta">
            <div className="expiry-lbl">Valid until</div>
            <div className="expiry-val" id="expiryVal">
              {validUntil}
            </div>
          </div>
          <div className="bar-track">
            <ExpiryFill percent={expiryPercent} fillClass={expiryFillClass} />
          </div>
        </div>
        {(planId != null || devicesLabel != null || protocolLabel != null) && (
          <div className="data-grid three" style={{ marginTop: 12 }}>
            {planId != null && (
              <div className="data-cell">
                <div className="dc-key">Plan ID</div>
                <div
                  className="dc-val teal"
                  style={{ fontSize: 10, cursor: onCopyPlanId ? "pointer" : undefined }}
                  onClick={onCopyPlanId ? () => onCopyPlanId(planId) : undefined}
                  role={onCopyPlanId ? "button" : undefined}
                >
                  {planId}
                </div>
              </div>
            )}
            {devicesLabel != null && (
              <div className="data-cell">
                <div className="dc-key">Devices</div>
                <div className="dc-val amber">{devicesLabel}</div>
              </div>
            )}
            {protocolLabel != null && (
              <div className="data-cell">
                <div className="dc-key">Protocol</div>
                <div className="dc-val teal">{protocolLabel}</div>
              </div>
            )}
          </div>
        )}
        <div className="btn-row-auto" style={{ marginTop: 14 }}>
          <button type="button" className="btn-primary success" onClick={onRenew}>
            Renew Plan
          </button>
          <button type="button" className="btn-secondary" style={{ width: "auto", padding: "0 18px" }} onClick={onManage}>
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}
