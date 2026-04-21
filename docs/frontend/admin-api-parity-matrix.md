# Admin API Parity Matrix

Last updated: 2026-04-20

This matrix tracks parity between `apps/admin-api/app/api/v1` and `apps/admin-web/src/features`.
Status values:
- `Covered`: endpoint is used directly by admin-web.
- `Partially covered`: endpoint family is used, but not all actions are exposed in UI.
- `Gap`: no admin-web surface yet.

## 1) Devices

| Endpoint | Status | Notes |
|---|---|---|
| `GET /devices` | Covered | List + filters in Devices page. |
| `GET /devices/summary` | Covered | KPI widgets. |
| `GET /devices/config-health` | Covered | Config health table. |
| `GET /devices/{id}` | Covered | Device detail modal. |
| `POST /devices/{id}/reconcile` | Covered | Device and config health actions. |
| `POST /devices/{id}/revoke` | Covered | Revoke modal. |
| `POST /devices/{id}/suspend` | Covered | Detail actions. |
| `POST /devices/{id}/resume` | Covered | Detail actions. |
| `POST /devices/{id}/reissue` | Covered | Rotate config flow. |
| `GET /devices/{id}/awg/download-link` | Covered | AWG QR flow. |
| `POST /devices/bulk-revoke` | Covered | Added selection + bulk revoke toolbar. |
| `POST /devices/{id}/sync-peer` | Covered | Added advanced action. |
| `POST /devices/{id}/reset` | Covered | Added advanced action. |
| `POST /devices/{id}/block` | Covered | Added advanced action with token modal. |
| `POST /devices/{id}/delete` | Covered | Added advanced action with confirm modal. |
| `PATCH /devices/{id}` | Gap | Generic edit not exposed yet. |
| `PATCH /devices/{id}/limits` | Gap | Device limits editor not exposed yet. |

## 2) Billing / Plans / Subs

| Endpoint | Status | Notes |
|---|---|---|
| `GET /plans` | Covered | Plans tab. |
| `POST /plans` | Covered | Add plan modal. |
| `PATCH /plans/{id}` | Covered | Edit plan + hide/unhide (`is_archived`). |
| `POST /plans/{id}/clone` | Covered | Plan action. |
| `PATCH /plans/reorder` | Covered | Up/down ordering. |
| `DELETE /plans/{id}` | Covered | Delete with confirm. |
| `GET /payments` | Covered | Payments tab. |
| `GET /subscriptions` | Covered | Subscription records tab. |
| `PATCH /subscriptions/{id}` | Covered | Grace, pause/enable/block actions. |
| `GET /admin/entitlement-events` | Covered | Entitlement events tab. |
| `GET /admin/churn-surveys` | Covered | Cancellation reasons tab. |

## 3) Servers / Cluster

| Endpoint | Status | Notes |
|---|---|---|
| `GET /servers` | Covered | Servers settings panel list. |
| `POST /servers` | Covered | Add server modal. |
| `PATCH /servers/{id}` | Covered | Active toggle, ops settings update. |
| `DELETE /servers/{id}` | Covered | Delete server flow. |
| `POST /servers/{id}/sync` | Covered | Sync now. |
| `GET /servers/snapshots/summary` | Covered | Main servers table. |
| `GET /servers/vpn-nodes` | Covered | VPN node cards/grid. |
| `GET /servers/{id}/limits` | Covered | Added limits load in server modal. |
| `PATCH /servers/{id}/limits` | Covered | Added limits save action. |
| `POST /cluster/nodes/{id}/drain` | Covered | Added drain action in server modal. |
| `POST /cluster/nodes/{id}/undrain` | Covered | Added undrain action in server modal. |
| `POST /servers/{id}/restart` | Partially covered | Endpoint exists but backend returns `501 NOT_IMPLEMENTED`; not surfaced as action. |
| `GET /servers/{id}/capabilities` | Gap | Not surfaced in UI yet. |
| `GET /servers/{id}/status` | Gap | Not surfaced in UI yet. |
| `GET /servers/{id}/health` | Gap | Not surfaced in UI yet. |
| `POST /servers/patch bulk actions` | Gap | Bulk draining/provisioning ops not surfaced yet. |

## 4) Automation / Control Plane

| Endpoint | Status | Notes |
|---|---|---|
| `GET /control-plane/automation/status` | Covered | Automation page status. |
| `POST /control-plane/automation/run` | Covered | Dry-run + execute controls. |
| `POST /cluster/scan` | Covered | Automation page cluster actions. |
| `POST /cluster/resync` | Covered | Automation page cluster actions. |
| `GET /control-plane/events` | Gap | No events feed page yet. |
| `GET /control-plane/topology/*` | Gap | No dedicated topology UI yet. |
| `GET /control-plane/metrics/*` | Gap | No dedicated business/security/anomaly metrics UI yet. |
| `POST /control-plane/rebalance/plan` | Gap | No explicit planner UI yet. |
| `POST /control-plane/failover/evaluate` | Gap | No failover simulation UI yet. |

## 5) Remaining high-priority gaps (next implementation batch)

1. Add **Device limits editor** (`PATCH /devices/{id}/limits`) in Device detail.
2. Add **Server health/status/capabilities panel** (`/servers/{id}/health`, `/status`, `/capabilities`).
3. Add **Control-plane events stream/table** (`GET /control-plane/events`) under Automation.
4. Add **Topology summary + graph/placement simulation** read surfaces.
5. Add **bulk server action toolbar** for drain/undrain/provisioning toggles.

