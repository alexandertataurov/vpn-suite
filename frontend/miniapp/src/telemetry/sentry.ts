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
        return event;
      },
    });
  });
}
