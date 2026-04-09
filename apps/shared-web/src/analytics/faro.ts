/** Grafana Faro RUM. Gated by env; no-op when disabled. */

let faroInitialized = false;

export interface FaroConfig {
  collectorUrl: string;
  appName: string;
  appVersion?: string;
  enabled?: boolean;
  /** URLs (string or RegExp) for traceparent propagation on fetch/XHR (CORS). */
  propagateTraceHeaderCorsUrls?: (string | RegExp)[];
}

/** Initialize Faro. Call once at app bootstrap. */
export async function initFaro(config: FaroConfig): Promise<boolean> {
  if (!config.enabled || !config.collectorUrl?.trim()) {
    return false;
  }
  try {
    const { initializeFaro, getWebInstrumentations } = await import("@grafana/faro-web-sdk");
    const { TracingInstrumentation } = await import("@grafana/faro-web-tracing");

    const propagateUrls = config.propagateTraceHeaderCorsUrls ?? [
      /\/api\/v1\/.*/,  // miniapp/admin API paths
      /\/api\/health/,
    ];

    initializeFaro({
      url: config.collectorUrl,
      app: {
        name: config.appName,
        version: config.appVersion ?? "0.0.0",
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation({
          instrumentationOptions: {
            propagateTraceHeaderCorsUrls: propagateUrls,
          },
        }),
      ],
    });
    faroInitialized = true;
    return true;
  } catch {
    faroInitialized = false;
    return false;
  }
}

export function isFaroInitialized(): boolean {
  return faroInitialized;
}

/** Get trace_id and span_id for correlation. Returns empty; pass trace_id from API X-Request-ID via context. */
export function getFaroTraceContext(): { trace_id?: string; span_id?: string } {
  return {};
}
