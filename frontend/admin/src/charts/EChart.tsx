import type { ComponentType, CSSProperties } from "react";
import { Suspense, lazy, memo, useRef, useEffect, forwardRef } from "react";
import type { EChartsOption } from "echarts";

type EChartsReactRef = { getEchartsInstance: () => { resize: () => void } } | null;

// `echarts` is sizeable. Lazy-load the wrapper + a minimal ECharts registry together.
const ReactECharts = lazy(async () => {
  const [{ default: ReactEChartsImpl }, { echarts }] = await Promise.all([
    import("echarts-for-react"),
    import("./echarts-lite"),
  ]);

  const Impl = ReactEChartsImpl as unknown as ComponentType<Record<string, unknown> & { ref?: React.Ref<EChartsReactRef> }>;
  return {
    default: forwardRef<EChartsReactRef, Record<string, unknown>>(function LazyEChart(props, ref) {
      return <Impl {...props} ref={ref} echarts={echarts} />;
    }),
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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsReactRef>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance?.()?.resize?.();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resolvedStyle: CSSProperties | undefined =
    height == null
      ? style
      : {
          ...style,
          width: style?.width ?? "100%",
          height: typeof height === "number" ? `${height}px` : height,
        };
  return (
    <div ref={containerRef} className="ref-echart-container">
      <Suspense fallback={<div className="ref-chart-suspense" />}>
        <ReactECharts
          ref={chartRef}
          className={className}
          style={resolvedStyle}
          option={option}
          notMerge={notMerge}
          lazyUpdate={lazyUpdate}
          onEvents={onEvents}
          opts={opts ?? { renderer: "canvas" }}
        />
      </Suspense>
    </div>
  );
});
