import { useMemo } from "react";

export interface MiniWaveformProps {
  data?: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

export function MiniWaveform({
  data = [],
  width = 40,
  height = 16,
  stroke = "var(--accent)",
}: MiniWaveformProps) {
  const path = useMemo(() => {
    const pts = data.length > 0 ? data : Array.from({ length: 20 }, () => Math.random() * 0.6 + 0.2);
    const w = width - 2;
    const h = height - 2;
    const step = w / (pts.length - 1) || 1;
    return pts
      .map((y, i) => `${i * step + 1},${h + 1 - y * h}`)
      .join(" ");
  }, [data, width, height]);

  return (
    <svg
      className="mini-waveform"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <polyline fill="none" stroke={stroke} strokeWidth="1" points={path} />
    </svg>
  );
}
