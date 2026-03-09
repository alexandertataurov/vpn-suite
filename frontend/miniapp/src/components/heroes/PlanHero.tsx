import { useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";
import { Button, ButtonRowAuto } from "@/design-system";

export type PlanHeroStatus = "active" | "expiring" | "expired";

/** Bar fill width set after mount (≥380ms) per content library constraint. */
function ExpiryFill({
  percent,
  fillClass = "ok",
}: {
  percent: number;
  fillClass?: "ok" | "warn" | "crit";
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    const clamped = Math.max(0, Math.min(100, percent));
    const t = setTimeout(() => {
      fillRef.current?.style.setProperty("--bar-fill-width", `${clamped}%`);
    }, 380);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div
      ref={fillRef}
      className={`bar-fill bar-fill--animated ${fillClass}`}
      id="expiryFill"
      role="progressbar"
      aria-label="Plan expiry progress"
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
  onCopyPlanId?: (fullId: string) => void;
  onRenew?: () => void;
  onManage?: () => void;
  renewLabel?: string;
  manageLabel?: string;
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
  onCopyPlanId,
  onRenew,
  onManage,
  renewLabel = "Renew Plan",
  manageLabel = "Manage",
  status = "active",
  className = "",
  ...props
}: PlanHeroProps) {
  const statusClass = status === "expiring" ? "expiring" : status === "expired" ? "expired" : "";

  return (
    <div
      className={["plan-hero", statusClass, "stagger-1", className].filter(Boolean).join(" ")}
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
          <div className="plan-hero-price" aria-label={priceMain ? `Telegram Stars ${priceMain}` : undefined}>
            <span className="plan-hero-price-label" aria-hidden>Telegram Stars</span>
            <div className="plan-hero-price-main">{priceMain}{priceSub != null ? <sub>.{priceSub}</sub> : null}</div>
            <div className="plan-hero-period">{period}</div>
          </div>
        </div>
        <div className="expiry-row">
          <div className="expiry-meta">
            <div className="expiry-lbl">Subscription valid until</div>
            <div className="expiry-val" id="expiryVal">
              {validUntil}
            </div>
          </div>
          <div className="bar-track">
            <ExpiryFill percent={expiryPercent} fillClass={expiryFillClass} />
          </div>
        </div>
        {(planId != null || devicesLabel != null) && (
          <div className="data-grid plan-hero-meta">
            {devicesLabel != null && (
              <div className="data-cell">
                <div className="dc-key">Devices</div>
                <div className="dc-val amber">{devicesLabel}</div>
              </div>
            )}
            <div className="data-cell">
              <div className="dc-key">Data</div>
              <div className="dc-val teal">Unlimited</div>
            </div>
            {planId != null && (
              <div className="data-cell wide">
                <div className="dc-key">Plan ID</div>
                <div
                  className={[
                    "dc-val",
                    "teal",
                    "plan-hero-planid",
                    onCopyPlanId ? "is-clickable" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={onCopyPlanId ? () => onCopyPlanId(planId) : undefined}
                  onKeyDown={
                    onCopyPlanId
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCopyPlanId(planId);
                          }
                        }
                      : undefined
                  }
                  role={onCopyPlanId ? "button" : undefined}
                  tabIndex={onCopyPlanId ? 0 : undefined}
                  aria-label={onCopyPlanId ? "Copy plan ID" : undefined}
                >
                  {planId}
                </div>
              </div>
            )}
          </div>
        )}
        {onRenew ? (
          <ButtonRowAuto className="plan-hero-actions">
            <Button variant="primary" size="lg" onClick={onRenew}>
              {renewLabel}
            </Button>
            {onManage ? (
              <Button variant="secondary" size="lg" className="is-compact" onClick={onManage}>
                {manageLabel}
              </Button>
            ) : null}
          </ButtonRowAuto>
        ) : null}
      </div>
    </div>
  );
}
