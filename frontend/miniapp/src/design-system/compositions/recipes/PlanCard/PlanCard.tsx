/**
 * Plan card per amnezia-miniapp-design-guidelines.md §4.3.
 * Borders only, no shadows. StatusChip badge + 3-column stats strip.
 */
import type { HTMLAttributes } from "react";
import { StatusChip } from "../../patterns";
import styles from "./PlanCard.module.css";

export type PlanCardStatus = "active" | "expiring" | "expired";

export interface PlanCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Plan name; planName is alias */
  plan: string;
  planSub: string;
  status: PlanCardStatus;
  devices: number;
  deviceLimit: number;
  renewsLabel: string;
  /** Traffic display; default "∞" */
  traffic?: string;
}

const BADGE_LABEL: Record<PlanCardStatus, string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
};

export function PlanCard({
  plan,
  planSub,
  status,
  devices,
  deviceLimit,
  renewsLabel,
  traffic = "∞",
  className = "",
  ...props
}: PlanCardProps) {
  const renewsStatLabel = status === "expired" ? "Expired" : "Renews";
  const renewsValueTone = status === "expired" ? "expired" : status === "expiring" ? "expiring" : "default";

  return (
    <div className={`${styles.root} ${className}`.trim()} data-layer="PlanCard" {...props}>
      <div className={styles.body}>
        <div className={styles.head}>
          <div className={styles.meta}>
            <span className={`${styles.planName} plan-name`}>{plan}</span>
            <span className={styles.planSub}>{planSub}</span>
          </div>
          <StatusChip variant={status} label={BADGE_LABEL[status]} />
        </div>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Devices</span>
          <span className={styles.statValue}>
            {devices}
            <span className={styles.statDim}> / {deviceLimit}</span>
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{renewsStatLabel}</span>
          <span
            className={
              renewsValueTone === "expired"
                ? `${styles.statValue} ${styles.statValueExpired}`
                : renewsValueTone === "expiring"
                  ? `${styles.statValue} ${styles.statValueExpiring}`
                  : styles.statValue
            }
          >
            {renewsLabel}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Traffic</span>
          <span className={styles.statValue}>{traffic}</span>
        </div>
      </div>
    </div>
  );
}
