/**
 * Plan card per amnezia-miniapp-design-guidelines.md §4.3.
 * Borders only, no shadows. StatusChip badge + 3-column stats strip.
 * Merged PlanCard + PlanHeroCard: supports optional eyebrow and flexible stats.
 */
import type { HTMLAttributes } from "react";
import { StatusChip } from "../../../patterns";
import styles from "./PlanCard.module.css";

export type PlanCardStatus = "active" | "expiring" | "expired";

export interface PlanCardStat {
  label: string;
  value: string;
  /** Dim fraction e.g. " / 5" — uses --text3 */
  dim?: string;
  /** When true, value uses --amber (expiring) or --red (expired) */
  tone?: "default" | "expiring" | "expired";
}

export interface PlanCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Plan name */
  plan: string;
  planSub: string;
  /** Optional eyebrow above plan name (hero variant) */
  eyebrow?: string;
  status: PlanCardStatus;
  /** Stats array; when omitted, derived from devices/deviceLimit/renewsLabel/traffic */
  stats?: [PlanCardStat, PlanCardStat, PlanCardStat];
  devices?: number;
  deviceLimit?: number;
  renewsLabel?: string;
  /** Traffic display; default "∞" */
  traffic?: string;
  statusLabel?: string;
}

const BADGE_LABEL: Record<PlanCardStatus, string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
};

function buildStatsFromProps(props: {
  status: PlanCardStatus;
  devices: number;
  deviceLimit: number;
  renewsLabel: string;
  traffic: string;
}): [PlanCardStat, PlanCardStat, PlanCardStat] {
  const { status, devices, deviceLimit, renewsLabel, traffic } = props;
  const renewsStatLabel = status === "expired" ? "Expired" : "Renews";
  const renewsTone: PlanCardStat["tone"] =
    status === "expired" ? "expired" : status === "expiring" ? "expiring" : "default";
  return [
    {
      label: "Devices",
      value: String(devices),
      dim: ` / ${deviceLimit}`,
      tone: "default",
    },
    { label: renewsStatLabel, value: renewsLabel, tone: renewsTone },
    { label: "Traffic", value: traffic, tone: "default" },
  ];
}

export function PlanCard({
  plan,
  planSub,
  eyebrow,
  status,
  stats: statsProp,
  devices = 0,
  deviceLimit = 0,
  renewsLabel = "",
  traffic = "∞",
  statusLabel,
  className = "",
  ...props
}: PlanCardProps) {
  const stats =
    statsProp ??
    buildStatsFromProps({ status, devices, deviceLimit, renewsLabel, traffic });
  const heroClass = eyebrow ? "hero-card" : "";
  const isHero = !!eyebrow;

  const card = (
    <div
      className={`${styles.root} ${heroClass} ${className}`.trim()}
      data-layer="PlanCard"
      data-status={status}
      {...props}
    >
      <div className={`${styles.body} plan-body`}>
        <div className={`${styles.head} plan-top`}>
          <div className={styles.meta}>
            {eyebrow ? (
              <span className={`${styles.eyebrow} plan-eyebrow`}>{eyebrow}</span>
            ) : null}
            <p className={`${styles.planName} plan-name`}>{plan}</p>
            <span className={`${styles.planSub} plan-sub`}>{planSub}</span>
          </div>
          <StatusChip variant={status} label={statusLabel ?? BADGE_LABEL[status]} />
        </div>
      </div>
      <div className={`${styles.stats} plan-stats`}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.stat} p-stat`}>
            <span className={`${styles.statLabel} p-stat-label`}>{stat.label}</span>
            <span
              className={
                stat.tone === "expiring"
                  ? `${styles.statValue} ${styles.statValueExpiring} p-stat-val`
                  : stat.tone === "expired"
                    ? `${styles.statValue} ${styles.statValueExpired} p-stat-val`
                    : `${styles.statValue} p-stat-val`
              }
            >
              {stat.value}
              {stat.dim ? (
                <span className={`${styles.statDim} dim`}>{stat.dim}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return isHero ? (
    <div className={styles.ledWrapper} data-status={status}>
      {card}
    </div>
  ) : (
    card
  );
}
