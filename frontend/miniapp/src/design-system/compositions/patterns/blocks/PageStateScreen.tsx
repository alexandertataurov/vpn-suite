import type { HTMLAttributes, ReactNode } from "react";
import { PageScaffold } from "../../layouts";
import { IconAlertTriangle, IconLock, IconShield, IconWifiOff, IconX } from "../../../icons";
import { MissionChip, MissionModuleHead, type MissionChipTone, type MissionTone } from "../mission/Mission";
import { StatusChip, type StatusChipVariant } from "../ui/StatusChip";

export type PageStateVariant = "attention" | "blocked" | "info" | "fatal";
export type PageStateMode = "replace" | "overlay" | "inline";

const VARIANT_CARD_TONE: Record<PageStateVariant, MissionTone> = {
  attention: "amber",
  blocked: "red",
  info: "blue",
  fatal: "red",
};

const VARIANT_CHIP_STYLE: Record<PageStateVariant, StatusChipVariant> = {
  attention: "pending",
  blocked: "blocked",
  info: "info",
  fatal: "offline",
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getDefaultIcon(variant: PageStateVariant, label: ReactNode) {
  const normalizedLabel = typeof label === "string" ? label.toLowerCase() : "";
  if (normalizedLabel.includes("permission")) return <IconShield size={32} strokeWidth={1.75} aria-hidden />;
  if (normalizedLabel.includes("auth")) return <IconLock size={32} strokeWidth={1.75} aria-hidden />;
  if (normalizedLabel.includes("network")) return <IconWifiOff size={32} strokeWidth={1.75} aria-hidden />;

  switch (variant) {
    case "attention":
      return <IconAlertTriangle size={32} strokeWidth={1.75} aria-hidden />;
    case "blocked":
      return <IconLock size={32} strokeWidth={1.75} aria-hidden />;
    case "fatal":
      return <IconX size={32} strokeWidth={1.75} aria-hidden />;
    case "info":
    default:
      return <IconWifiOff size={32} strokeWidth={1.75} aria-hidden />;
  }
}

export interface PageStateScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  panelTone?: MissionTone;
  label: string;
  chipTone?: MissionChipTone;
  chipText: string;
  alertTitle: ReactNode;
  alertMessage: ReactNode;
  actions?: ReactNode;
  variant?: PageStateVariant;
  mode?: PageStateMode;
  icon?: ReactNode;
  iconLabel?: string;
  alertTone?: "info" | "warning" | "error" | "success";
}

/**
 * Reusable page-state shell for blocking authentication/error screens.
 */
export function PageStateScreen({
  panelTone,
  label,
  chipTone,
  chipText,
  alertTitle,
  alertMessage,
  actions,
  variant = "info",
  mode = "replace",
  icon,
  iconLabel,
  alertTone: _alertTone,
  className,
  ...props
}: PageStateScreenProps) {
  void _alertTone;
  const resolvedPanelTone = panelTone ?? VARIANT_CARD_TONE[variant];
  const resolvedIcon = icon ?? getDefaultIcon(variant, label);

  return (
    <PageScaffold
      className={joinClasses(
        "page-state-screen",
        `page-state-screen--${variant}`,
        `page-state-screen--${mode}`,
        className
      )}
      {...props}
    >
      <div className="page-state-screen-shell">
        <section className={joinClasses("state-card", "state-card--rich", `state-card--${variant}`)}>
          <MissionModuleHead
            label={label}
            chip={
              chipTone ? (
                <MissionChip tone={chipTone}>{chipText}</MissionChip>
              ) : (
                <StatusChip variant={VARIANT_CHIP_STYLE[variant]}>{chipText}</StatusChip>
              )
            }
          />
          <div className={joinClasses("state-surface", `state-surface--${resolvedPanelTone}`, `state-surface--${variant}`)}>
            {resolvedIcon ? (
              <div className="state-surface-icon-wrap">
                <div className="state-surface-icon" aria-label={iconLabel}>
                  {resolvedIcon}
                </div>
              </div>
            ) : null}
            <div className="state-surface-copy">
              <h2 className="state-surface-title">{alertTitle}</h2>
              <p className="state-surface-message">{alertMessage}</p>
            </div>
          </div>
          {actions ? <div className="state-actions">{actions}</div> : null}
        </section>
      </div>
    </PageScaffold>
  );
}
