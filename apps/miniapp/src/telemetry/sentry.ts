/** Keys known to contain sensitive data; values replaced with [redacted]. */
const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "initdata",
  "init_data",
  "token",
  "access_token",
  "refresh_token",
  "tgwebappdata",
]);

function redactSensitive(obj: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return obj ?? {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    const isSensitive = [...SENSITIVE_KEYS].some((sk) => lower.includes(sk));
    out[k] = isSensitive ? "[redacted]" : typeof v === "object" && v && !Array.isArray(v) ? redactSensitive(v as Record<string, unknown>) : v;
  }
  return out;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  // Load Sentry only when configured to keep bootstrap bundle lean.
  void import("@sentry/browser").then(({ init }) => {
    const tracesSampleRate = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
    init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENV ?? "local",
      release: import.meta.env.VITE_SENTRY_RELEASE,
      tracesSampleRate:
        tracesSampleRate && Number.isFinite(Number(tracesSampleRate))
          ? Number(tracesSampleRate)
          : undefined,
      // errors.ts is single capture for unhandled errors; avoid duplicate reports.
      integrations: (integrations) =>
        integrations.filter((i) => i.name !== "GlobalHandlers"),
      beforeSend(event) {
        if (event.request?.headers) {
          const headers = { ...event.request.headers };
          for (const key of Object.keys(headers)) {
            const lower = key.toLowerCase();
            if (lower.includes("authorization") || lower.includes("cookie")) {
              headers[key] = "[redacted]";
            }
          }
          event.request.headers = headers;
        }
        if (event.extra && typeof event.extra === "object") {
          event.extra = redactSensitive(event.extra as Record<string, unknown>);
        }
        if (event.contexts && typeof event.contexts === "object") {
          event.contexts = redactSensitive(event.contexts as Record<string, unknown>) as typeof event.contexts;
        }
        if (event.request?.data && typeof event.request.data === "object") {
          event.request.data = redactSensitive(event.request.data as Record<string, unknown>);
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
          const data = breadcrumb.data as Record<string, unknown> | undefined;
          if (data?.url && typeof data.url === "string") {
            try {
              const u = new URL(data.url);
              const params = u.searchParams;
              params.forEach((_, key) => {
                const lower = key.toLowerCase();
                const isSensitive = [...SENSITIVE_KEYS].some((sk) => lower.includes(sk));
                if (isSensitive) params.set(key, "[redacted]");
              });
              data.url = u.toString();
            } catch {
              data.url = "[redacted]";
            }
          }
        }
        return breadcrumb;
      },
    });
  });
}

/** Capture exception from app code (errors.ts, AppErrorBoundary). Call after init. */
export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  try {
    const Sentry = await import("@sentry/browser");
    Sentry.captureException(error, { extra: context ? redactSensitive(context) : undefined });
  } catch {
    /* ignore */
  }
}
