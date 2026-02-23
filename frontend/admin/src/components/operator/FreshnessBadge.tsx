import { PrimitiveBadge, type PrimitiveBadgeVariant } from "@vpn-suite/shared/ui";

type Freshness = "fresh" | "degraded" | "stale";

export interface FreshnessBadgeProps {
  freshness: Freshness;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const variantMap: Record<Freshness, PrimitiveBadgeVariant> = {
  fresh: "success",
  degraded: "warning",
  stale: "danger",
};

export function FreshnessBadge({ freshness, children, className, title }: FreshnessBadgeProps) {
  return (
    <PrimitiveBadge variant={variantMap[freshness]} size="sm" className={className} title={title}>
      {children}
    </PrimitiveBadge>
  );
}
