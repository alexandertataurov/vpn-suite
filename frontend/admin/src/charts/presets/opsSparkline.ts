import type { EChartsOption } from "echarts";
import { type TimeZoneMode, formatTimeAxis, safeNumber } from "@vpn-suite/shared";
import type { XY } from "../timeseries";
import { axisTooltipFormatter } from "./opsTimeseries";
import { getChartTheme } from "../theme";

function defaultYAxisFormatter(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(Math.round(v));
}

export function makeOpsSparklineOption(args: {
  tz: TimeZoneMode;
  series: Array<{ name: string; data: XY[]; color: string; area?: boolean; areaColor?: string }>;
  tooltipValue: (seriesName: string, v: number | null) => string;
  /** Format Y-axis labels; default compact (1k, 1M) */
  yAxisFormatter?: (v: number) => string;
}): EChartsOption {
  const t = getChartTheme();
  const yAxisFormatter = args.yAxisFormatter ?? defaultYAxisFormatter;

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
    textStyle: { fontFamily: t.fontFamily, color: t.muted, fontSize: t.axisFontSize },
    grid: {
      left: 44,
      right: 12,
      top: 12,
      bottom: 28,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.border, width: 1 } },
      confine: true,
      appendToBody: true,
      transitionDuration: 0,
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      borderWidth: 1,
      padding: 0,
      extraCssText: "border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,0.08);",
      formatter: axisTooltipFormatter({ tz: args.tz, formatValue: args.tooltipValue }),
    },
    xAxis: {
      type: "time",
      show: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: t.faint,
        fontSize: t.axisFontSize,
        formatter: (v: string | number) =>
          typeof v === "number" ? formatTimeAxis(v, { tz: args.tz, rangeMs }) : String(v),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      show: true,
      splitNumber: 4,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: t.faint,
        fontSize: t.axisFontSize,
        formatter: (v: number) => yAxisFormatter(v),
      },
      splitLine: {
        show: true,
        lineStyle: { color: t.grid || t.faint || "rgba(0,0,0,0.06)", type: "solid", width: 1, opacity: 0.4 },
      },
    },
    series: args.series.map((s) => ({
      name: s.name,
      type: "line",
      data: s.data,
      showSymbol: false,
      sampling: "lttb",
      lineStyle: { color: s.color, width: 1.5, lineCap: "round", lineJoin: "round" },
      itemStyle: { color: s.color },
      areaStyle: s.area
        ? s.areaColor
          ? { color: s.areaColor }
          : { color: s.color, opacity: 0.12 }
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

