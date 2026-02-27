import type { EChartsOption } from "echarts";
import { type TimeZoneMode, formatTimeAxis, safeNumber } from "@vpn-suite/shared";
import type { XY } from "../timeseries";
import { axisTooltipFormatter } from "./opsTimeseries";
import { getChartTheme } from "../theme";

/** Compact axis/tooltip: 1000 → 1K, 1.2e6 → 1.2M, 1e9 → 1G. */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    const g = value / 1_000_000_000;
    return g % 1 === 0 ? `${g}G` : `${g.toFixed(1)}G`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(value));
}

function defaultYAxisFormatter(v: number): string {
  return formatCompact(v);
}

export function makeOpsSparklineOption(args: {
  tz: TimeZoneMode;
  series: Array<{ name: string; data: XY[]; color: string; area?: boolean; areaColor?: string }>;
  tooltipValue: (seriesName: string, v: number | null) => string;
  yAxisFormatter?: (v: number) => string;
  /** Container width for tick density and grid; smaller → fewer splits, tighter margins */
  containerWidth?: number;
}): EChartsOption {
  const t = getChartTheme();
  const yAxisFormatter = args.yAxisFormatter ?? defaultYAxisFormatter;
  const w = args.containerWidth ?? 400;
  const isNarrow = w < 280;
  const splitNumber = isNarrow ? 2 : w < 360 ? 2 : w < 500 ? 3 : 4;
  const grid = isNarrow
    ? { left: 4, right: 6, top: 6, bottom: 34, containLabel: true as const }
    : { left: 48, right: 16, top: 16, bottom: 32, containLabel: true as const };
  const axisFontSize = isNarrow ? Math.max(9, t.axisFontSize - 1) : t.axisFontSize;

  const allTs: number[] = [];
  for (const s of args.series) {
    for (const [ts] of s.data) {
      if (ts > 0) allTs.push(ts);
    }
  }
  const minTs = allTs.length ? Math.min(...allTs) : 0;
  const maxTs = allTs.length ? Math.max(...allTs) : 0;
  const rangeMs = minTs && maxTs ? Math.max(0, maxTs - minTs) : 0;

  return {
    backgroundColor: "transparent",
    animation: false,
    textStyle: { fontFamily: t.fontFamily, color: t.muted, fontSize: axisFontSize },
    grid,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.border, width: 1, opacity: 0.8 } },
      confine: true,
      appendToBody: true,
      transitionDuration: 0,
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      borderWidth: 1,
      padding: [10, 12],
      extraCssText: "border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,0.1);font-weight:500;",
      formatter: axisTooltipFormatter({ tz: args.tz, formatValue: args.tooltipValue }),
    },
    xAxis: {
      type: "time",
      show: true,
      boundaryGap: [0, 0],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: t.faint,
        fontSize: axisFontSize,
        margin: isNarrow ? 6 : 10,
        align: "center",
        formatter: (v: string | number) =>
          typeof v === "number" ? formatTimeAxis(v, { tz: args.tz, rangeMs }) : String(v),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      show: true,
      splitNumber,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: !isNarrow,
        align: "right",
        color: t.faint,
        fontSize: axisFontSize,
        margin: isNarrow ? 4 : 8,
        formatter: (v: number) => yAxisFormatter(v),
      },
      splitLine: {
        show: true,
        lineStyle: { color: t.grid || t.faint || "rgba(0,0,0,0.06)", type: "solid", width: 1, opacity: 0.35 },
      },
    },
    series: args.series.map((s) => ({
      name: s.name,
      type: "line",
      data: s.data,
      showSymbol: false,
      sampling: "lttb",
      smooth: 0.18,
      lineStyle: { color: s.color, width: 2, lineCap: "round", lineJoin: "round" },
      itemStyle: { color: s.color },
      areaStyle: s.area
        ? s.areaColor
          ? { color: s.areaColor }
          : { color: s.color, opacity: 0.14 }
        : undefined,
      clip: true,
      encode: { x: 0, y: 1 },
      emphasis: { disabled: true },
    })),
  };
}

export function sparklineValueFromAxisParams(p: unknown): number | null {
  // Useful for chart event handlers if needed; keep it robust to ECharts payload shapes.
  if (p == null || typeof p !== "object") return null;
  const anyP = p as { value?: unknown; data?: unknown };
  const raw = anyP.value ?? anyP.data;
  if (Array.isArray(raw)) return safeNumber(raw[1]);
  return safeNumber(raw);
}

