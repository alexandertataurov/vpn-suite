# API Usage Audit

## API Client (shared/src/api-client/create-client.ts)

| Feature | Implementation |
|---------|----------------|
| AbortController | Composes caller signal with 15s timeout |
| Timeout | 15_000ms default; configurable |
| Retry | 502/503/504, max 2 retries, 500ms backoff |
| 401 | onUnauthorized callback; token refresh or logout |
| getBlob | Binary responses; same auth, retry, timeout |
| Error normalization | ApiError with code, message, statusCode |

## Call Sites (~30+ useQuery/useMutation)

| Location | Endpoint pattern | Method | Signal | Error handling |
|----------|------------------|--------|--------|----------------|
| useServerList | /servers?* | GET | ✓ | Network cooldown, retry |
| ServerDetail | /servers/:id, /telemetry, /peers, /actions | GET/POST | ✓ | PageError, toast |
| Users, UserDetail | /users, /users/:id, /devices/issue | GET/POST | ✓ | PageError, toast |
| Devices | /devices, /devices/:id/revoke | GET/POST | ✓ | PageError, toast |
| ControlPlane | /control-plane/topology/*, /metrics/* | GET/POST | ✓ | InlineAlert |
| OutlineIntegrations | /integrations/outline/* | GET/POST | ✓ | toast |
| useDockerTelemetry | /telemetry/docker/* | GET | ✓ | Backoff on failure |
| useSession (miniapp) | /me | GET | ✓ | AuthGuard redirect |
| Checkout | /invoices, /promo/validate | POST | ✓ | toast |
| Plans, Referral | /plans, /referral/* | GET | ✓ | ErrorState |

## Storage

| Key | Storage | Purpose |
|-----|---------|---------|
| vpn_admin_access, vpn_admin_refresh | sessionStorage | Auth tokens |
| vpn-suite-theme | localStorage | Theme (dark/light) |
| vpn-suite-sidebar-collapsed | localStorage | Sidebar state |
| vpn-suite-admin-region | localStorage | Region filter |
| vpn-suite-density | localStorage | Table density |
| visibleWidgets, pinnedRegion | localStorage | Dashboard settings |
| savedViews | localStorage | Saved filter views |

## Failure Modes

| Mode | Handling |
|------|----------|
| Network unreachable | ApiError NETWORK_UNREACHABLE; network cooldown (useServerList) |
| Timeout | ApiError TIMEOUT; retry via TanStack Query |
| 401 | onUnauthorized → refresh or logout → redirect |
| 403/404/5xx | ApiError; PageError or toast; retry for 502/503/504 |
| Parse error | ApiError PARSE_ERROR |

## Race Conditions

- TanStack Query cancels in-flight requests on unmount/signal abort
- Rapid filter changes: queryKey includes filters; stale requests discarded
- No identified stale-closure or double-fetch issues
