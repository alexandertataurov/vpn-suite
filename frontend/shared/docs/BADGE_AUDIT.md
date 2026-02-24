# Badge Component Audit

## 1. Current Implementation Summary

### Components

| Component | Location | Role | Styling |
|-----------|----------|------|---------|
| `PrimitiveBadge` | `shared/ui/primitives/Badge.tsx` | Base pill (neutral/success/warning/danger/info) | Token-driven |
| `HealthBadge` | `shared/ui/composites/HealthBadge.tsx` | Domain status label | Token-driven |
| `ref-stream-badge` | admin.css | Live/Degraded/Offline indicator | Custom CSS (legacy) |
| `.ds-badge` | shared/ui/styles/primitives/index.css | Primitive badge base | Token-driven |

### PrimitiveBadge

- **Variants:** neutral, success, warning, danger, info
- **Sizes:** sm, md
- **Shape:** pill
- **API:** `variant`, `size`, `asChild`

---

## 2. Where Badges Appear

| Location | Component/Class | Domain | Variant logic |
|----------|-----------------|--------|---------------|
| PaymentsTab, Payments | PrimitiveBadge | Payment status | completed→success, failed→danger, else→neutral |
| SubscriptionsTab, Subscriptions | PrimitiveBadge | Subscription | status map | PrimitiveBadge | Connection | connected→success, degraded→warning, offline→danger |
| UserDetail | PrimitiveBadge | User banned | banned→danger else success |
| Users | PrimitiveBadge | User status | banned→danger else success |
| Servers | PrimitiveBadge | Stream state | live/degraded/offline |
| ServerDetail | PrimitiveBadge | Server health | map via `serverHealthBadge` |
| ServerRow, VpnNodesTab | PrimitiveBadge | Server/Node | map via `serverHealthBadge` / visual status |
| DeviceCard | PrimitiveBadge | Device | revoked→danger else success |
| ProfileCard | PrimitiveBadge | Subscription | status map |
| TimeSeriesPanel, VpnNodesTab | PrimitiveBadge | Data status | map via helpers |
| Devices | PrimitiveBadge | Filter | info (region label) |
| Telemetry | PrimitiveBadge | Filter | info |
| ConnectionNodesSection | PrimitiveBadge | Node type / status | type→info/neutral; status→success/warning |
| DockerOverviewTable | PrimitiveBadge | Container state | map via `containerStatusToVariant` |
| DockerServicesTab | PrimitiveBadge | Fetch state | fetching→warning else success |
| AlertsPanel | PrimitiveBadge | Alert severity | critical→danger, warning→warning, info→info |
| Styleguide | PrimitiveBadge | Demo | all variants |

---

## 3. Issues Found

### 3.1 Inconsistent status meanings

| Domain | Same meaning | Different mappings |
|--------|--------------|--------------------|
| Subscription | active | ProfileCard: active→success; SubscriptionsTab: active→success (OK) |
| Subscription | cancelled/expired | ProfileCard: error; SubscriptionsTab: default |
| Server | online/running | PrimitiveBadge success |
| Server | degraded | PrimitiveBadge warning; ref-stream degraded→warning |
| Stream | live | PrimitiveBadge success; ref-stream-badge (legacy) |
| User | banned | PrimitiveBadge danger |

### 3.2 Duplicate / scattered implementations

- **ref-stream-badge** in admin.css — live/degraded/offline as custom badge, not using PrimitiveBadge
- **admin.css .status-badge-*** — removed (StatusBadge deleted)

### 3.3 Badge API gaps

- PrimitiveBadge now has sizes and `asChild`
- Dot handled via `ds-badge-dot` class (intentional, no prop)
- No `count`-style badge (numeric)

### 3.4 Per-page / per-component overrides

- `ProfileCard` maps status→variant inline
- `TimeSeriesPanel` maps status→variant inline
- `DockerOverviewTable` maps state→variant inline
- Status maps status→variant inline
- `AlertsPanel` maps severity→variant inline
- No central `statusMap.ts`

### 3.5 Shape / typography drift

- PrimitiveBadge: pill (consistent)

### 3.6 Contrast / accessibility

- Badge color usage should remain semantic and token-driven; no bespoke backgrounds.
- Legacy badge CSS uses older tokens; admin theme may differ from shared tokens
- No explicit WCAG check on badge text/background pairs

---

## 4. Target Fixes (Phase 1)

1. **Single Badge component** — `PrimitiveBadge` with strict variants
2. **statusMap.ts** — canonical mappings: server, subscription, payment, stream, container, user
3. **Replace ref-stream-badge** — use `PrimitiveBadge` with dot class
4. **Remove** — legacy badge CSS and status indicators
5. **Unify shape** — pill default; document radius tokens
7. **Unify tokens** — all badge styling via shared tokens (no Tailwind accent in Badge)
