import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface MetricStripProps {
  children: ReactNode;
  className?: string;
}

export function MetricStrip(props: MetricStripProps) {
  return <div className={cn("ds-metric-strip", props.className)}>{props.children}</div>;
}

MetricStrip.displayName = "MetricStrip";
