import { type TimeZoneMode, formatTime, formatTimeAxis, safeNumber } from "@vpn-suite/shared";
import { buildAxisTooltipHTML, type TooltipRow } from "../TelemetryTooltip";
import { getChartTheme } from "../theme";
import { toMs, type XY } from "../timeseries";
import type { EChartsOption } from "echarts";

type AxisValue = unknown;

function valueFromParams(p: unknown): { tsMs: number | null; v: number | null; color: string; name: string } | null {
  if (p == null || typeof p !== "object") return null;
  const anyP = p as {
    axisValue?: AxisValue;
    seriesName?: unknown;
    value?: unknown;
    data?: unknown;
    color?: unknown;
  };

  const name = typeof anyP.seriesName === "string" ? anyP.seriesName : "Series";
  const color = typeof anyP.color === "string" ? anyP.color : "#000";

  const axisValue = anyP.axisValue;
  const tsMs =
    typeof axisValue === "number"
      ? toMs(axisValue)
      : typeof axisValue === "string"
        ? toMs(axisValue)
        : null;

  const raw = anyP.value ?? anyP.data;
  let v: number | null = null;
  if (Array.isArray(raw)) {
    v = safeNumber(raw[1]);
  } else {
    v = safeNumber(raw);
  }

  return { tsMs, v, color, name };
}

export function axisTooltipFormatter(args: {
  tz: TimeZoneMode;
  formatValue: (seriesName: string, v: number | null) => string;
}) {
  return (params: unknown) => {
    const arr = Array.isArray(params) ? params : [params];
    const parsed = arr.map(valueFromParams).filter(Boolean) as Array<
      NonNullable<ReturnType<typeof valueFromParams>>
    >;
    const ts = parsed.find((p) => p.tsMs != null)?.tsMs ?? null;
    if (!ts) return "";

    const seen = new Set<string>();
    const rows: TooltipRow[] = [];
    for (const p of parsed) {
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      rows.push({
        name: p.name,
        color: p.color,
        value: args.formatValue(p.name, p.v),
      });
    }

    return buildAxisTooltipHTML({ tsMs: ts, tz: args.tz, rows });
  };
}

export function makeOpsTimeseriesOption(args: {
  title?: string;
  tz: TimeZoneMode;
  series: Array<{
    name: string;
    data: XY[];
    color: string;
    area?: boolean;
    stack?: string;
    type?: "line" | "bar";
  }>;
  yAxisFormatter: (v: number) => string;
  tooltipValue: (seriesName: string, v: number | null) => string;
  yMin?: number;
  yMax?: number;
  showLegend?: boolean;
  showZoom?: boolean | "auto";
  height?: number;
  /** Container width for tick density; smaller width → fewer axis splits */
  containerWidth?: number;
}): EChartsOption {
  const t = getChartTheme();
  const splitNumber = args.containerWidth != null
    ? args.containerWidth < 360 ? 2 : args.containerWidth < 500 ? 3 : 4
    : 4;

  const allTs: number[] = [];
  let maxPoints = 0;
  for (const s of args.series) {
    maxPoints = Math.max(maxPoints, s.data.length);
    for (const [ts] of s.data) {
      if (ts > 0) allTs.push(ts);
    }
  }
  const minTs = allTs.length ? Math.min(...allTs) : 0;
  const maxTs = allTs.length ? Math.max(...allTs) : 0;
  const rangeMs = minTs && maxTs ? Math.max(0, maxTs - minTs) : 0;

  const zoomMode = args.showZoom ?? false;
  const enableZoom =
    zoomMode === true ||
    (zoomMode === "auto" && (rangeMs > 6 * 60 * 60 * 1000 || maxPoints > 900));

  return {
    backgroundColor: "transparent",
    animation: false,
    textStyle: {
      fontFamily: t.fontFamily,
      color: t.muted,
      fontSize: t.axisFontSize,
    },
    grid: {
      left: 44,
      right: 12,
      top: args.showLegend ? 28 : 12,
      bottom: enableZoom ? 44 : 28,
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
    legend: args.showLegend
      ? {
          top: 4,
          right: 8,
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: t.muted, fontSize: t.axisFontSize },
        }
      : undefined,
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
          formatTimeAxis(typeof v === "number" ? v : toMs(v), { tz: args.tz, rangeMs }),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: args.yMin ?? 0,
      max: args.yMax,
      show: true,
      splitNumber,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: t.faint,
        fontSize: t.axisFontSize,
        formatter: (v: number) => args.yAxisFormatter(v),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: t.grid || t.faint || "rgba(0,0,0,0.06)",
          width: 1,
          type: "solid",
          opacity: 0.6,
        },
      },
    },
    dataZoom: enableZoom
      ? [
          { type: "inside", throttle: 50 },
          {
            type: "slider",
            height: 18,
            bottom: 8,
            borderColor: "transparent",
            backgroundColor: t.grid,
            fillerColor: t.border,
            handleSize: 0,
            showDetail: false,
            textStyle: { color: t.muted },
          },
        ]
      : undefined,
    series: args.series.map((s) => {
      const isBar = s.type === "bar";
      return {
        name: s.name,
        type: s.type ?? "line",
        data: s.data,
        stack: s.stack,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 4,
        sampling: isBar ? undefined : "lttb",
        large: isBar ? true : undefined,
        largeThreshold: 2000,
        clip: true,
        lineStyle: isBar ? undefined : { color: s.color, width: 2, lineCap: "round", lineJoin: "round" },
        itemStyle: { color: s.color },
        areaStyle: !isBar && s.area ? { color: s.color, opacity: 0.12 } : undefined,
        emphasis: { disabled: true },
      };
    }),
    // Helps tooltip show time with explicit TZ in the payload (used in HTML title).
    aria: { enabled: false },
    title: args.title
      ? {
          text: args.title,
          left: 0,
          top: 0,
          textStyle: { fontFamily: t.fontFamily, fontSize: 12, fontWeight: 600, color: t.text },
        }
      : undefined,
  };
}

export function formatRangeMeta(args: { fromMs?: number; toMs?: number; tz: TimeZoneMode }): string | null {
  if (!args.fromMs || !args.toMs) return null;
  const from = formatTime(args.fromMs, { tz: args.tz, withSeconds: false });
  const to = formatTime(args.toMs, { tz: args.tz, withSeconds: false });
  return `${from} to ${to}`;
}
