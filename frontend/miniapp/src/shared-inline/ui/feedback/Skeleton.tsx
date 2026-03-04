import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type SkeletonVariant = "default" | "line" | "card" | "list" | "shimmer";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
  /** Prefer className with CSS token-based styles. Use style only for truly dynamic values. */
  style?: CSSProperties;
}

const variantClass: Record<SkeletonVariant, string> = {
  default: "",
  line: "skeleton-line",
  card: "skeleton-card",
  list: "skeleton-list",
  shimmer: "skeleton-shimmer",
};

export function Skeleton({
  width,
  height,
  variant = "default",
  className = "",
  style,
  children,
  ...props
}: SkeletonProps) {
  const baseClass = cn("skeleton", variantClass[variant], className);
  const resolvedStyle = width == null && height == null && !style ? style : { width, height, ...style };
  if (variant === "list" && children) {
    return (
      <div className={baseClass} aria-hidden {...props}>
        {children}
      </div>
    );
  }
  return (
    <div
      className={baseClass}
      style={resolvedStyle}
      aria-hidden
      {...props}
    />
  );
}

/** Skeleton for a single line of text */
export function SkeletonLine({
  className = "",
  ...props
}: Omit<SkeletonProps, "variant">) {
  return (
    <Skeleton variant="line" className={className} {...props} />
  );
}

/** Skeleton for a card block */
export function SkeletonCard({
  className = "",
  style,
  ...props
}: Omit<SkeletonProps, "variant">) {
  return (
    <Skeleton
      variant="card"
      className={className}
      style={style}
      {...props}
    />
  );
}

/** Skeleton for a list of lines */
export function SkeletonList({
  lines = 4,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <Skeleton variant="list" className={className}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} />
      ))}
    </Skeleton>
  );
}
