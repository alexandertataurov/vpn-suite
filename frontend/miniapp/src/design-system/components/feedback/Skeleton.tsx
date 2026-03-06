import { useRef, useLayoutEffect } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonVariant = "default" | "line" | "card" | "list" | "shimmer";

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
}

const variantClass: Record<SkeletonVariant, string> = {
  default: "",
  line: "skeleton-line",
  card: "skeleton-card",
  list: "skeleton-list",
  shimmer: "skeleton-shimmer",
};

function toCssValue(v: string | number | undefined): string | undefined {
  if (v == null) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

export function Skeleton({
  width,
  height,
  variant = "default",
  className = "",
  children,
  ...props
}: SkeletonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const w = toCssValue(width);
  const h = toCssValue(height);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (w != null) el.style.setProperty("--skeleton-width", w);
    else el.style.removeProperty("--skeleton-width");
    if (h != null) el.style.setProperty("--skeleton-height", h);
    else el.style.removeProperty("--skeleton-height");
  }, [w, h]);

  const baseClass = cn("skeleton", variantClass[variant], className);
  if (variant === "list" && children) {
    return (
      <div ref={ref} className={baseClass} aria-hidden {...props}>
        {children}
      </div>
    );
  }
  return (
    <div ref={ref} className={baseClass} aria-hidden {...props} />
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
  ...props
}: Omit<SkeletonProps, "variant">) {
  return (
    <Skeleton
      variant="card"
      className={className}
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
