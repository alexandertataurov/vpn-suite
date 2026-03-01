import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const env = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, string> }).env ?? {} : {};
  const dsn = env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const tracesSampleRate = Number(env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.05");
  Sentry.init({
    dsn,
    environment: env.VITE_SENTRY_ENV ?? "local",
    release: env.VITE_SENTRY_RELEASE,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
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
}
