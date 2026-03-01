import { cn } from "@vpn-suite/shared";

export type SkeletonVariant = "line" | "block" | "circle" | "card" | "list" | "shimmer";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant = "line", className, width, height, style, children, ...props }: SkeletonProps) {
  const mergedStyle: React.CSSProperties = { ...style };
  if (width != null) mergedStyle.width = typeof width === "number" ? `${width}px` : width;
  if (height != null) mergedStyle.height = typeof height === "number" ? `${height}px` : height;

  if (variant === "list" && children) {
    return (
      <div className={cn("ds-skeleton", "ds-skeleton--list", className)} style={mergedStyle} aria-hidden {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("ds-skeleton", `ds-skeleton--${variant}`, className)}
      style={mergedStyle}
      aria-hidden
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

export function SkeletonLine({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return <Skeleton variant="line" className={className} {...props} />;
}

export function SkeletonCard({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return <Skeleton variant="card" className={className} {...props} />;
}

export function SkeletonList({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <Skeleton variant="list" className={className}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} />
      ))}
    </Skeleton>
  );
}
