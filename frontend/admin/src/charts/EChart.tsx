import type { ComponentType, CSSProperties } from "react";
import { Suspense, lazy, memo } from "react";
import type { EChartsOption } from "echarts";

// `echarts` is sizeable. Lazy-load the wrapper + a minimal ECharts registry together.
const ReactECharts = lazy(async () => {
  const [{ default: ReactEChartsImpl }, { echarts }] = await Promise.all([
    import("echarts-for-react"),
    import("./echarts-lite"),
  ]);

  // Wrap to inject our modular ECharts instance.
  // Keep this wrapper loosely typed to avoid tight coupling to echarts-for-react's prop types.
  const Impl = ReactEChartsImpl as unknown as ComponentType<Record<string, unknown>>;
  return {
    default: function LazyEChart(props: Record<string, unknown>) {
      return <Impl {...props} echarts={echarts} />;
    },
  };
});

export type EChartProps = {
  option: EChartsOption;
  className?: string;
  style?: CSSProperties;
  height?: number | string;
  onEvents?: Record<string, (params: unknown) => void>;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  opts?: Record<string, unknown>;
};

export const EChart = memo(function EChart({
  option,
  className,
  style,
  height,
  onEvents,
  notMerge = true,
  lazyUpdate = true,
  opts,
}: EChartProps) {
  const resolvedStyle: CSSProperties | undefined =
    height == null
      ? style
      : {
          ...style,
          width: style?.width ?? "100%",
          height: typeof height === "number" ? `${height}px` : height,
        };
  return (
    <Suspense fallback={<div className="ref-chart-suspense" />}>
      <ReactECharts
        className={className}
        style={resolvedStyle}
        option={option}
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        onEvents={onEvents}
        opts={opts ?? { renderer: "canvas" }}
      />
    </Suspense>
  );
});
