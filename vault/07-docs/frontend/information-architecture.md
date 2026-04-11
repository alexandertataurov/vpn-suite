# Dashboard Information Architecture

## Primary vs critical vs live vs static

| Category | Content | Routes | Update |
|----------|---------|--------|--------|
| **Primary** | Cluster/overview status, key metrics, alerts | `/` (Overview) | Live strip + polling |
| **Operationally critical** | Servers/nodes list, health, telemetry; revenue/subscription health; audit | `/servers`, `/telemetry`, `/revenue`, `/audit` | Live where applicable; otherwise polling |
| **Live** | Real-time metrics, connection state, last updated | Overview strip, Telemetry page | SSE/WebSocket or 1–5s polling when visible |
| **Static** | Settings, styleguide, one-off config | `/settings` | On demand |

## Drill-down

- **Servers** → server detail (single node)
- **Users** → user detail
- **Telemetry** → node/chart detail
- **Overview** → links to Servers, Audit, key KPIs

## Layout hierarchy

- **Shell:** NavRail (left) + MissionBar (top) + content area (Outlet).
- **Content:** Page title → sections → tables/cards. Critical actions and status above the fold; secondary and config below.
- **Real-time:** Dedicated strip or panel with "last updated" and connection state; no duplicated widgets between Overview and child pages.

## Noise reduction

- One overview strip for cluster/health; no duplicate KPIs on child pages.
- Single telemetry provider; no per-feature streams.
