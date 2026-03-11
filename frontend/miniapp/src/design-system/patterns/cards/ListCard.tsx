import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import {
  IconMonitor,
  IconServer,
  IconShield,
  IconSmartphone,
  IconTerminal,
} from "../../icons";

export interface ListCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  children: ReactNode;
}

/** Content Library 9: list card container with optional title. */
export function ListCard({ title, children, className = "", ...props }: ListCardProps) {
  return (
    <div className={`list-card ${className}`.trim()} {...props}>
      {title != null ? <div className="list-card-title">{title}</div> : null}
      {children}
    </div>
  );
}

export type ListRowIconTone = "g" | "b" | "a" | "r" | "n";
export type ListRowDeviceType = "macos" | "ios" | "android" | "windows" | "linux" | "router" | "unknown";
export type DeviceStatus = "active" | "pending" | "offline" | "blocked" | "needs_refresh" | "info";

function formatRelativeLastActive(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function defaultDeviceIcon(deviceType: ListRowDeviceType) {
  switch (deviceType) {
    case "macos":
    case "windows":
      return <IconMonitor size={16} strokeWidth={1.75} aria-hidden />;
    case "ios":
    case "android":
      return <IconSmartphone size={16} strokeWidth={1.75} aria-hidden />;
    case "linux":
      return <IconTerminal size={16} strokeWidth={1.75} aria-hidden />;
    case "router":
      return <IconServer size={16} strokeWidth={1.75} aria-hidden />;
    case "unknown":
    default:
      return <IconShield size={16} strokeWidth={1.75} aria-hidden />;
  }
}

function subtitleFromStatus(status: DeviceStatus | undefined, lastActiveAt: Date | null) {
  if (status === "needs_refresh") return "Needs refresh";
  return formatRelativeLastActive(lastActiveAt);
}

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  icon?: ReactNode;
  iconTone?: ListRowIconTone;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleMono?: boolean;
  right?: ReactNode;
  rightColumn?: boolean;
  deviceType?: ListRowDeviceType;
  status?: DeviceStatus;
  lastActiveAt?: Date | null;
}

/** Content Library 9: list row (device, transaction, etc.). */
export function ListRow({
  icon,
  iconTone = "n",
  title,
  subtitle,
  subtitleMono,
  right,
  rightColumn,
  deviceType,
  status,
  lastActiveAt = null,
  className = "",
  ...props
}: ListRowProps) {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!lastActiveAt) return;
    const timer = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [lastActiveAt]);

  void tick;

  const resolvedIcon = icon ?? (deviceType ? defaultDeviceIcon(deviceType) : null);
  const resolvedSubtitle = subtitle ?? subtitleFromStatus(status, lastActiveAt);

  return (
    <div className={`list-row ${className}`.trim()} {...props}>
      {resolvedIcon != null ? (
        <div className={`lr-ico ${iconTone}`}>{resolvedIcon}</div>
      ) : (
        <div className={`lr-ico ${iconTone}`} aria-hidden />
      )}
      <div className="lr-body">
        <div className="lr-title">{title}</div>
        {resolvedSubtitle != null ? (
          <div
            className={`lr-sub ${subtitleMono ? "lr-mono" : ""}`.trim()}
            data-status={status}
          >
            {resolvedSubtitle}
          </div>
        ) : null}
      </div>
      {right != null ? (
        <div className={`lr-right ${rightColumn ? "lr-right-col" : ""}`.trim()}>{right}</div>
      ) : null}
    </div>
  );
}
