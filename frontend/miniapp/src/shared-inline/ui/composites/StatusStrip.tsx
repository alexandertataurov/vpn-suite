import type { HTMLAttributes } from "react";
import { Stack as PrimitiveStack } from "../primitives/Stack";
import { HealthBadge, type HealthBadgeStatus } from "./HealthBadge";

export interface StatusStripItem {
  status: HealthBadgeStatus;
  label?: string;
}

export interface StatusStripProps extends HTMLAttributes<HTMLDivElement> {
  items: StatusStripItem[];
}

export function StatusStrip({ items, ...props }: StatusStripProps) {
  return (
    <PrimitiveStack direction="horizontal" gap="2" wrap {...props}>
      {items.map((item, idx) => ( // key=
        <HealthBadge key={`${item.status}-${idx}`} status={item.status} label={item.label} />
      ))}
    </PrimitiveStack>
  );
}
