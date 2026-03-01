import { Badge, type BadgeVariant } from "@/design-system";

type Freshness = "fresh" | "degraded" | "stale";

export interface FreshnessBadgeProps {
  freshness: Freshness;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const variantMap: Record<Freshness, BadgeVariant> = {
  fresh: "nominal",
  degraded: "warning",
  stale: "critical",
};

export function FreshnessBadge({ freshness, children, className, title }: FreshnessBadgeProps) {
  return (
    <Badge variant={variantMap[freshness]} size="sm" className={className} title={title}>
      {children}
    </Badge>
  );
}
