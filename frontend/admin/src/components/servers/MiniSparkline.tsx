/**
 * 48×20px inline sparkline. 7-point data, gradient fill.
 * Uses recharts AreaChart with no axes.
 */
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

function idFromColor(c: string): string {
  return c.replace(/[^a-z0-9]/gi, "");
}

export function MiniSparkline({
  data,
  color = "var(--color-interactive-default)",
  className = "",
}: MiniSparklineProps) {
  const points = data.length
    ? data.map((v, i) => ({ v, i }))
    : Array.from({ length: 7 }, (_, i) => ({ v: 0, i }));
  const gradId = `spark-${idFromColor(color)}`;
  return (
    <div className={`h-5 w-12 ${className}`} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
