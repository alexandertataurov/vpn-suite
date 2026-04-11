# Telemetry and Error Reporting

## Error Reporting

- **reportError** — Single entry for errors. Normalizes, then forwards to backend (`/log/frontend-error`), PostHog (`trackError`), and Sentry (`captureException`). Call from `wireGlobalErrors`, `AppErrorBoundary`, or explicit catch blocks.
- **wireGlobalErrors** — Wires `unhandledrejection` and `error` to `reportError`. Sentry's GlobalHandlers integration is disabled to avoid duplicate capture.
- **sentry.ts** — Init, redaction (`beforeSend` / `beforeBreadcrumb`), and `captureException`. Redacts init data, tokens, auth headers, and sensitive URL params.

## Web Vitals

- **initWebVitals** — TTFB, FCP, LCP, CLS, INP. Optional: set `VITE_WEB_VITALS_ENABLED=0` to disable. Defaults to `VITE_ANALYTICS_ENABLED` when unset.

## Startup

- **main.tsx** — Telemetry bootstrap runs before React mount: `initAnalytics`, `wireGlobalErrors`, `initWebVitals`, `initSentry`.
