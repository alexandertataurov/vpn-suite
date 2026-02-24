# Operator UI Spec

Consolidated spec: Top bar, sidebar, dashboard layout, UX patterns, and refinement plan for the Admin Dashboard.

---

## 1. Implemented (Done)

| Area | Status |
|------|--------|
| Health strip | 4 groups (System, Cluster, Performance, Sync) with separators |
| Context zone | Region, Env badge |
| Search | Ctrl+K hint; CommandPalette |
| Alerts | Bell + count in bar |
| Mode controls | Polling interval, refresh button |
| Sidebar | CONTROL, ACCESS, NETWORK, SYSTEM groups |
| Active state | 2px left border, subtle bg |
| Sidebar collapse | Icon-only 48px |
| Density | 4px grid; max 48px bar height |
| Dark mode | Sidebar border contrast |

---

## 2. Layout Schematic

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] Brand  │ Region [v] Prod  │ System │ Cluster │ Performance │ Sync  │ Search  Bell  Mode  Theme  Logout │
│            │                  │ Score  │ Nodes   │ Latency     │ 3s ago│                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

CONTROL: Dashboard, Servers, Telemetry, Incidents
ACCESS: Users, Devices
NETWORK: Automation
SYSTEM: Billing, Audit log, Settings
```

---

## 3. Component Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| TopStatusBar / HealthStrip | operator | System, Cluster, Performance, Sync groups |
| HealthScore, SubsystemStatus | operator | API, Prom status |
| MetricCell | shared/operator | value + optional microBar |
| ModeDisplay | operator | Polling/Stream + interval |
| Sidebar, NavSection, NavItem | operator | Grouped nav; collapse |
| CommandPalette | admin | Ctrl+K search |

---

## 4. Tokens (4px Grid)

| Token | Value | Use |
|-------|-------|-----|
| --spacing-op-1 | 4px | Base unit |
| --spacing-op-2 | 8px | Cell padding |
| --spacing-op-3 | 12px | Section gap |
| --spacing-op-4 | 16px | Group gap |
| --text-op-score | 15–18px | Health score |
| --text-op-nav-section | 10–11px | Sidebar section |
| --border-subtle | token | Dividers |
| --radius-op | 4px | Max radius |

Replace hardcoded `6px`, `10px`, `18px` with tokens.

---

## 5. Patterns to Adopt

- Group status (Health/Cluster/Traffic/Sync); primary metric dominant (Score)
- Placeholder for empty: `—` in muted, not raw "No data"
- Tooltips with threshold context (e.g. Error %: &lt;1% ok, 1–5% degraded, &gt;5% down)
- Degraded states: subtle amber; avoid neon
- Transitions: max 150ms; ease-out

---

## 6. Refinement Checklist (Pending)

| Item | Area |
|------|------|
| Score font-weight 600 | Health strip |
| Cluster matrix: 2px micro-bars, sortable headers | Cluster |
| Incident empty state styling | Incidents |
| Chart gridlines, crosshair axisPointer | Traffic |
| User sessions trend arrows (↑↓) | Sessions |
| Server table: row hover, column widths, filter input, skeleton loading | Server table |
| Live indicator when data fresh (&lt;30s) | Status bar |
| Vertical spacing reduction (~10%) | Global |
| Dark mode: border/header contrast pass | Dark mode |

---

## 7. References

- [operator-dashboard-spec.md](operator-dashboard-spec.md) — Metrics inventory, PromQL, layout grid
- [telemetry-spec.md](telemetry-spec.md) — Metric → source → UI
