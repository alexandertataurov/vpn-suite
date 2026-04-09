import type { HTMLAttributes } from "react";
import { Skeleton } from "@/design-system";
import "./RowItem.css";

export type RowItemSkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Skeleton placeholder for RowItem while data is loading. */
export function RowItemSkeleton({ className = "", ...props }: RowItemSkeletonProps) {
  return (
    <div className={`row-item row-item-skeleton ${className}`.trim()} aria-hidden {...props}>
      <div className="ri-icon ri-skeleton-icon">
        <Skeleton width={36} height={36} className="ri-skeleton-block" />
      </div>
      <div className="ri-body">
        <Skeleton width={120} height={13} variant="line" className="ri-skeleton-label" />
        <Skeleton width={80} height={11} variant="line" className="ri-skeleton-sub" />
      </div>
      <div className="ri-chev">
        <Skeleton width={13} height={13} className="ri-skeleton-chev" />
      </div>
    </div>
  );
}
