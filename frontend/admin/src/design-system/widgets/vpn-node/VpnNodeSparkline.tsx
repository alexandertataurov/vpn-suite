import { useId } from "react";
import type { SparkPoint } from "@/features/vpn-nodes/types";

interface VpnNodeSparklineProps {
  points: SparkPoint[];
  stroke?: string;
  title?: string;
  className?: string;
}

const W = 80;
const H = 20;

export function VpnNodeSparkline({
  points,
  stroke = "var(--chart-blue)",
  title,
  className = "",
}: VpnNodeSparklineProps) {
  const id = useId().replace(/:/g, "");
  const gradientId = `vpn-spark-${id}`;

  if (!points.length) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const toCoord = (p: SparkPoint) => {
    const x = ((p.x - minX) / spanX) * W;
    const y = H - 2 - ((p.y - minY) / spanY) * (H - 4);
    return [x, y] as const;
  };

  const coords = points.map(toCoord);
  const d = coords.length > 1 ? `M${coords[0][0]},${coords[0][1]} ${coords.slice(1).map(([x, y]) => `L${x},${y}`).join(" ")}` : "";

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`vpn-node-sparkline ${className}`.trim()}
      role="img"
      aria-label={title ?? "Sparkline"}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {d && (
        <>
          <path
            d={`${d} L${coords[coords.length - 1][0]} ${H} L${coords[0][0]} ${H} Z`}
            fill={`url(#${gradientId})`}
          />
          <path d={d} fill="none" stroke={stroke} strokeWidth={1.2} />
        </>
      )}
    </svg>
  );
}
