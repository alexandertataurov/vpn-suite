import type { HTMLAttributes } from "react";
import { Button, ButtonRowAuto, MissionProgressBar, type MissionHealthTone } from "@/design-system";

export type PlanHeroStatus = "active" | "expiring" | "expired";

function mapExpiryTone(fillClass: "ok" | "warn" | "crit"): MissionHealthTone {
  if (fillClass === "crit") {
    return "danger";
  }
  if (fillClass === "warn") {
    return "warning";
  }
  return "healthy";
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
  devicesLabel?: string;
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
  devicesLabel,
  onRenew,
  onManage,
  renewLabel = "Renew Plan",
  manageLabel = "Manage",
  status = "active",
  className = "",
  ...props
}: PlanHeroProps) {
  const statusClass = status === "expiring" ? "expiring" : status === "expired" ? "expired" : "";
  const expiryTone = mapExpiryTone(expiryFillClass);

  return (
    <div
      className={["plan-hero", statusClass, "stagger-1", className].filter(Boolean).join(" ")}
      {...props}
    >
      <div className="plan-hero-glow" aria-hidden />
      <div className="plan-hero-body">
        <div className="card-eyebrow">Current plan</div>
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
          <MissionProgressBar
            percent={expiryPercent}
            tone={expiryTone}
            ariaLabel="Plan expiry progress"
          />
        </div>
        {devicesLabel != null && (
          <div className="data-grid plan-hero-meta">
            <div className="data-cell wide">
              <div className="dc-key">Devices</div>
              <div className="dc-val amber">{devicesLabel}</div>
            </div>
          </div>
        )}
        {onRenew ? (
          <ButtonRowAuto className="plan-hero-actions">
            <Button variant="primary" size="md" onClick={onRenew}>
              {renewLabel}
            </Button>
            {onManage ? (
              <Button variant="link" size="sm" className="miniapp-inline-link plan-hero-manage-link" onClick={onManage}>
                {manageLabel}
              </Button>
            ) : null}
          </ButtonRowAuto>
        ) : null}
      </div>
    </div>
  );
}
