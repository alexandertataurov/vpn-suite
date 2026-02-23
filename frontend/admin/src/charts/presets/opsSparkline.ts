import type { EChartsOption } from "echarts";
import { type TimeZoneMode, safeNumber } from "@vpn-suite/shared";
import type { XY } from "../timeseries";
import { axisTooltipFormatter } from "./opsTimeseries";
import { getChartTheme } from "../theme";

export function makeOpsSparklineOption(args: {
  tz: TimeZoneMode;
  series: Array<{ name: string; data: XY[]; color: string; area?: boolean; areaColor?: string }>;
  tooltipValue: (seriesName: string, v: number | null) => string;
}): EChartsOption {
  const t = getChartTheme();

  return {
    backgroundColor: "transparent",
    animation: false,
    textStyle: { fontFamily: t.fontFamily, color: t.muted, fontSize: t.axisFontSize },
    grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: false },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", lineStyle: { color: t.border, width: 1 } },
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
      show: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      show: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: t.grid || t.faint || "rgba(0,0,0,0.06)", type: "solid", width: 1 },
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

