import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type StatDeltaDirection = "up" | "down" | "neutral";

export interface StatProps {
  value: ReactNode;
  unit?: string;
  label: ReactNode;
  delta?: { value: string; direction: StatDeltaDirection };
  className?: string;
}

const deltaDirClass: Record<StatDeltaDirection, string> = {
  up: "typo-stat-delta-up",
  down: "typo-stat-delta-down",
  neutral: "typo-stat-delta-neutral",
};

export function Stat({ value, unit, label, delta, className = "" }: StatProps) {
  return (
    <div className={cn("typo-stat", className)}>
      <p className="typo-stat-label">{label}</p>
      <p className="typo-stat-value">
        {value}
        {unit != null ? <span> {unit}</span> : null}
      </p>
      {delta != null ? (
        <span className={cn("typo-stat-delta", deltaDirClass[delta.direction])}>
          {delta.value}
        </span>
      ) : null}
    </div>
  );
}
