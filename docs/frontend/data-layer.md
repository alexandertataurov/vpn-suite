# Data Layer

## API

- **Single client:** `createApiClient()` in `main.tsx` with `getBaseUrl`, `getToken` from auth store, `onUnauthorized` → logout. Timeout 30s for list/overview.
- **Usage:** Features use `useApi()` from `core/api/context`. All server state via TanStack Query; query functions call `api.get/post/...` with optional `signal` for cancellation.
- **Retry:** Client retries 502/503/504 and network errors up to 2 times with backoff. No retry on 4xx except 401 (handled by auth).
- **Errors:** `ApiError` from shared/types; `mapApiErrorToAppError()` in core/errors/map for user-facing messages and retryable flag.

## Telemetry

- **Single provider:** `core/telemetry/provider`. Real-time via `startTelemetryStream()` (stub in Phase 1; wire SSE/WebSocket in Phase 4).
- **Visibility:** Polling/stream runs when tab visible; pause when hidden. Cleanup on unmount.
- **State:** `useTelemetry()` returns `cluster`, `connectionState`, `isLiveAvailable`. All metrics typed in core/telemetry/types.

## Endpoints (reference)

- Auth: `/auth/login`, `/auth/refresh`, `/auth/logout`
- Overview: `GET /overview/health-snapshot` (HealthSnapshotOut: sessions_active, incidents_count, metrics_freshness, etc.)
- Servers: `/servers`, `/servers/:id`
- Users, devices, audit, etc. per backend API. All go through the same client.
