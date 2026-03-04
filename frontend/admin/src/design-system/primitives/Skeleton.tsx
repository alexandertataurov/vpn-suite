import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width, height = 24, className = "" }: SkeletonProps) {
  const sizeStyle: CSSProperties = {};
  if (width !== undefined) sizeStyle.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) sizeStyle.height = typeof height === "number" ? `${height}px` : height;
  return <div className={`skeleton ${className}`.trim()} style={sizeStyle} aria-hidden />;
}
