import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import {
  IconMonitor,
  IconServer,
  IconShield,
  IconSmartphone,
  IconTerminal,
} from "../../../icons";

export interface ListCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  children: ReactNode;
}

/** Modern List Card container. */
export function ListCard({ title, children, className = "", ...props }: ListCardProps) {
  return (
    <div className={`modern-list ${className}`.trim()} {...props}>
      {title != null ? (
        <div className="modern-section-title modern-list-header">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export type ListRowIconTone = "g" | "b" | "a" | "r" | "n" | "blue" | "green" | "amber" | "red" | "neutral";
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
      return <IconMonitor size={18} strokeWidth={2} aria-hidden />;
    case "ios":
    case "android":
      return <IconSmartphone size={18} strokeWidth={2} aria-hidden />;
    case "linux":
      return <IconTerminal size={18} strokeWidth={2} aria-hidden />;
    case "router":
      return <IconServer size={18} strokeWidth={2} aria-hidden />;
    case "unknown":
    default:
      return <IconShield size={18} strokeWidth={2} aria-hidden />;
  }
}

function subtitleFromStatus(status: DeviceStatus | undefined, lastActiveAt: Date | null) {
  if (status === "needs_refresh") return "Needs refresh";
  return formatRelativeLastActive(lastActiveAt);
}

function resolveModernTone(tone: ListRowIconTone): string {
  switch (tone) {
    case "g":
    case "green":
      return "modern-icon-tone--green";
    case "b":
    case "blue":
      return "modern-icon-tone--blue";
    case "a":
    case "amber":
      return "modern-icon-tone--amber";
    case "r":
    case "red":
      return "modern-icon-tone--red";
    case "n":
    case "neutral":
      return "modern-icon-tone--neutral";
    default:
      return "modern-icon-tone--neutral";
  }
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

/** Modern List Row. */
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

  // Use tick to force re-render for relative time
  void tick;
  void rightColumn;

  const resolvedIcon = icon ?? (deviceType ? defaultDeviceIcon(deviceType) : null);
  const resolvedSubtitle = subtitle ?? subtitleFromStatus(status, lastActiveAt);
  const modernToneClass = resolveModernTone(iconTone);
  const a11y = "onClick" in props && typeof props.onClick === "function"
    ? { role: "button" as const, tabIndex: 0 }
    : {};

  return (
    <div className={`modern-list-item ${className}`.trim()} {...a11y} {...props}>
      {resolvedIcon != null ? (
        <div className={`modern-list-item-icon ${modernToneClass}`}>{resolvedIcon}</div>
      ) : (
        <div className={`modern-list-item-icon ${modernToneClass}`} aria-hidden />
      )}
      <div className="modern-list-item-content">
        <div className="modern-list-item-title">{title}</div>
        {resolvedSubtitle != null ? (
          <div
            className={`modern-list-item-subtitle ${subtitleMono ? "lr-mono" : ""}`.trim()}
            data-status={status}
          >
            {resolvedSubtitle}
          </div>
        ) : null}
      </div>
      {right != null ? (
        <div className="modern-list-item-right">{right}</div>
      ) : null}
    </div>
  );
}
