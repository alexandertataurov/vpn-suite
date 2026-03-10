import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type HeaderAlertTone = "success" | "warning" | "info";

export interface HeaderAlertItem {
  id: string;
  tone: HeaderAlertTone;
  title: ReactNode;
  message: ReactNode;
  actionLabel?: ReactNode;
  actionTo?: string;
  actionHref?: string;
}

export interface HeaderAlertsContentProps {
  alerts: HeaderAlertItem[];
  /** Popover/list title. Default "Signals". */
  title?: string;
  onAction?: () => void;
}

export function HeaderAlertsContent({ alerts, title = "Signals", onAction }: HeaderAlertsContentProps) {
  if (alerts.length === 0) {
    return (
      <>
        <p className="miniapp-header-alert-popover-title">{title}</p>
        <p className="miniapp-header-alert-empty">No notifications</p>
      </>
    );
  }

  return (
    <>
      <p className="miniapp-header-alert-popover-title">{title}</p>
      <ul className="miniapp-header-alert-list" role="status" aria-live="polite">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`miniapp-header-alert-item miniapp-header-alert-item--${alert.tone}`}
          >
            <span className="miniapp-header-alert-item-dot" aria-hidden />
            <div className="miniapp-header-alert-item-body">
              <p className="miniapp-header-alert-item-title">{alert.title}</p>
              <p className="miniapp-header-alert-item-message">{alert.message}</p>
              {alert.actionLabel ? (
                alert.actionTo ? (
                  <Link to={alert.actionTo} className="miniapp-header-alert-action" onClick={onAction}>
                    {alert.actionLabel}
                  </Link>
                ) : alert.actionHref ? (
                  <a
                    href={alert.actionHref}
                    className="miniapp-header-alert-action"
                    onClick={onAction}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {alert.actionLabel}
                  </a>
                ) : null
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
