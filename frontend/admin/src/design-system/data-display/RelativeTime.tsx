import { useState, useEffect } from "react";
import { cn } from "@vpn-suite/shared";

export interface RelativeTimeProps {
  date: Date | string;
  className?: string;
  title?: string;
  updateInterval?: number;
  "data-testid"?: string;
}

function formatExact(d: Date): string {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(d: Date, now: Date): string {
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 0) return "just now";
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} d ago`;
  return formatExact(d);
}

function formatRelativeShort(d: Date, now: Date): string {
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 0) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return formatExact(d);
}

export function RelativeTime({
  date,
  className,
  title,
  updateInterval = 60_000,
  "data-testid": dataTestId,
}: RelativeTimeProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  const [now, setNow] = useState(() => new Date());
  const exact = formatExact(d);
  const relative = updateInterval <= 10_000 ? formatRelativeShort(d, now) : formatRelative(d, now);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), updateInterval);
    return () => clearInterval(t);
  }, [updateInterval]);

  return (
    <span title={title ?? exact} className={cn(className)} data-testid={dataTestId}>
      {relative}
    </span>
  );
}
