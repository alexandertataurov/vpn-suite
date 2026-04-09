import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { formatDateDisplay } from "@vpn-suite/shared";
import {
  IconChevronRight,
  IconMonitor,
  IconServer,
  IconShield,
  IconSmartphone,
  IconTerminal,
} from "../../../icons";
import { RowItem, type RowItemIconVariant } from "../RowItem";

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

/** Spec alias: default | danger | warning */
export type ListRowIconVariant = "default" | "danger" | "warning";
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
  return formatDateDisplay(date);
}

function defaultDeviceIcon(deviceType: ListRowDeviceType) {
  const iconProps = { size: 15 as const, strokeWidth: 2 as const, "aria-hidden": true as const };
  switch (deviceType) {
    case "macos":
    case "windows":
      return <IconMonitor {...iconProps} />;
    case "ios":
    case "android":
      return <IconSmartphone {...iconProps} />;
    case "linux":
      return <IconTerminal {...iconProps} />;
    case "router":
      return <IconServer {...iconProps} />;
    case "unknown":
    default:
      return <IconShield {...iconProps} />;
  }
}

function subtitleFromStatus(status: DeviceStatus | undefined, lastActiveAt: Date | null) {
  if (status === "needs_refresh") return "Needs refresh";
  return formatRelativeLastActive(lastActiveAt);
}

function resolveRowIconVariant(
  tone: ListRowIconTone,
  iconVariant?: ListRowIconVariant
): RowItemIconVariant {
  if (iconVariant === "danger") return "danger";
  if (iconVariant === "warning") return "warning";
  switch (tone) {
    case "g":
    case "green":
      return "green";
    case "b":
    case "blue":
      return "blue";
    case "a":
    case "amber":
      return "amber";
    case "r":
    case "red":
      return "red";
    case "n":
    case "neutral":
    default:
      return "neutral";
  }
}

function stripChevronFromRight(node: ReactNode): ReactNode {
  if (node == null) return undefined;
  if (isValidElement(node) && node.type === IconChevronRight) return undefined;
  if (Array.isArray(node)) {
    const filtered = node.filter(
      (c) => !(isValidElement(c) && c.type === IconChevronRight)
    );
    if (filtered.length === 0) return undefined;
    return filtered.length === 1 ? filtered[0] : filtered;
  }
  if (isValidElement(node)) {
    const children = (node.props as { children?: ReactNode }).children;
    if (children == null) return node;
    const stripped = stripChevronFromRight(children);
    if (stripped == null || (Array.isArray(stripped) && stripped.length === 0))
      return undefined;
    return cloneElement(node, {}, stripped);
  }
  return node;
}

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  icon?: ReactNode;
  iconTone?: ListRowIconTone;
  /** Spec: default | danger | warning; maps to iconTone */
  iconVariant?: ListRowIconVariant;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleMono?: boolean;
  right?: ReactNode;
  rightColumn?: boolean;
  deviceType?: ListRowDeviceType;
  status?: DeviceStatus;
  lastActiveAt?: Date | null;
  /** When false, hides trailing chevron (e.g. primary actions, not navigation). Default true. */
  showChevron?: boolean;
}

/** Modern List Row. Uses RowItem for consistent settings row layout. */
export function ListRow({
  icon,
  iconTone = "n",
  iconVariant,
  title,
  subtitle,
  subtitleMono,
  right,
  rightColumn,
  deviceType,
  status,
  lastActiveAt = null,
  showChevron = true,
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
  void rightColumn;

  const resolvedIcon = icon ?? (deviceType ? defaultDeviceIcon(deviceType) : <IconShield size={15} strokeWidth={2} aria-hidden />);
  const resolvedSubtitle = subtitle ?? subtitleFromStatus(status, lastActiveAt);
  const rowIconVariant = resolveRowIconVariant(iconTone, iconVariant);
  const rowRight = stripChevronFromRight(right);

  return (
    <RowItem
      icon={resolvedIcon}
      iconVariant={rowIconVariant}
      label={title}
      subtitle={resolvedSubtitle ?? undefined}
      subtitleClassName={subtitleMono ? "lr-mono" : undefined}
      right={rowRight}
      showChevron={showChevron}
      className={className}
      {...props}
    />
  );
}
