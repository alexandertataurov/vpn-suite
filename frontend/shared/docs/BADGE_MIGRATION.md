# Badge Migration Plan

## Goal

Replace all badge-like UI with `PrimitiveBadge` + `statusMap` helpers and `HealthBadge` for domain status. Remove legacy components and CSS.

---

## Incremental Steps

### 1. Use statusMap in new/updated code

Import from `@vpn-suite/shared`:
```ts
import { paymentStatusToVariant } from "@vpn-suite/shared";
// or
import { PrimitiveBadge } from "@vpn-suite/shared/ui";
```

Replace:
```tsx
<PrimitiveBadge variant={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "neutral"}>
  {r.status}
</PrimitiveBadge>
```
With:
```tsx
<PrimitiveBadge variant={paymentStatusToVariant(r.status)}>{r.status}</PrimitiveBadge>
```

### 2. Migrate Badge usages (no StatusBadge)

| File | Change |
|------|--------|
| PaymentsTab, Payments | `paymentStatusToVariant(r.status)` |
| SubscriptionsTab, Subscriptions | `subscriptionStatusToVariant(r.effective_status)` |
| UserDetail | `userStatusToVariant(!data.is_banned)` or inline |
| DeviceCard | `deviceStatusToVariant(status)` |
| ProfileCard | `subscriptionStatusToVariant(status)` |
| TimeSeriesPanel | `dataStatusToVariant(status)` |
| Devices, Telemetry | Keep `variant="info"` (filter tag) |
| ConnectionNodesSection | `connectionStatusToVariant` / `serverStatusToVariant` |
| DockerOverviewTable | `containerStatusToVariant(item.state)` |
| DockerServicesTab | Keep inline (fetch state) |
| AlertsPanel | Map severity → variant or add `alertSeverityToVariant` |
| VpnNodesTab | `dataStatusToVariant` for stream; `PrimitiveBadge` for server |

### 3. Replace ref-stream-badge with PrimitiveBadge

**Before (Servers.tsx):**
```tsx
<span className={`ref-stream-badge ref-stream-${connectionState}`}>
  {connectionState === "live" ? "Live" : ...}
</span>
```

**After:**
```tsx
<PrimitiveBadge variant={streamStatusToVariant(connectionState)} className="ds-badge-dot">
  <span className="ds-badge-dot-indicator" aria-hidden />
  {connectionState === "live" ? "Live" : connectionState === "degraded" ? "Degraded" : "Offline"}
</PrimitiveBadge>
```

### 4. Remove StatusBadge

Replace all StatusBadge usages with `PrimitiveBadge` or `HealthBadge`. StatusBadge has been removed.

### 5. Files to delete after migration

- Remove dead CSS:
  - `admin.css`: `.status-badge`, `.status-badge-sm`, …
  - `admin.css`: `.ref-stream-badge`, `.ref-stream-live`, …

---

## Validation Checklist

- [ ] `/admin/servers` — stream badge + table status badges
- [ ] `/admin/users`, user detail — status
- [ ] `/admin/subscriptions`, `/admin/payments` — table badges
- [ ] `/admin/telemetry` — nodes, docker, alerts
- [ ] Miniapp profile/plans — ProfileCard, DeviceCard
- [ ] Storybook: all variants, sizes, domain mappings
- [ ] No per-page badge styling; no Tailwind accent in Badge
- [ ] A11y: badge contrast acceptable
