import { useState, useRef, useEffect } from "react";
import { cn } from "@vpn-suite/shared";

export interface TimestampDisplayProps {
  value: Date | string | number;
  updateInterval?: number;
  className?: string;
}

function formatRelative(d: Date, now: Date): string {
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function TimestampDisplay(props: TimestampDisplayProps) {
  const { value, updateInterval = 60000, className } = props;
  const date = typeof value === "object" && value instanceof Date ? value : new Date(value);
  const [relative, setRelative] = useState(() => formatRelative(date, new Date()));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const dateTs = date.getTime();
  useEffect(() => {
    const tick = () => setRelative(formatRelative(new Date(dateTs), new Date()));
    tick();
    intervalRef.current = setInterval(tick, updateInterval);
    return () => clearInterval(intervalRef.current);
  }, [dateTs, updateInterval]);
  return (
    <time
      dateTime={date.toISOString()}
      title={date.toISOString()}
      className={cn("ds-timestamp", className)}
    >
      {relative}
    </time>
  );
}

TimestampDisplay.displayName = "TimestampDisplay";
