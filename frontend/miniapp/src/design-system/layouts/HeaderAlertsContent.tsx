import type { ReactNode } from "react";

export type HeaderAlertTone = "success" | "warning" | "info";

export interface HeaderAlertItem {
  id: string;
  tone: HeaderAlertTone;
  title: ReactNode;
  message: ReactNode;
}

export interface HeaderAlertsContentProps {
  alerts: HeaderAlertItem[];
  /** Popover/list title. Default "Signals". */
  title?: string;
}

export function HeaderAlertsContent({ alerts, title = "Signals" }: HeaderAlertsContentProps) {
  return (
    <>
      <p className="miniapp-header-alert-popover-title">{title}</p>
      <ul className="miniapp-header-alert-list">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`miniapp-header-alert-item miniapp-header-alert-item--${alert.tone}`}
          >
            <span className="miniapp-header-alert-item-dot" aria-hidden />
            <div className="miniapp-header-alert-item-body">
              <p className="miniapp-header-alert-item-title">{alert.title}</p>
              <p className="miniapp-header-alert-item-message">{alert.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
