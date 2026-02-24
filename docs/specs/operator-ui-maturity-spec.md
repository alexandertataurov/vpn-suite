# Operator-Grade UI Maturity Spec

Deep refinement of Top Status Bar, Sidebar Navigation, and Dashboard Layout. Token-driven, DRY, zero functional regressions.

---

## 1. Updated Layout Schematic

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] Brand  │ Region [v] Prod  │ SYNC GROUP                     │ Search  Bell  Mode  Theme  Logout     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SYSTEM          │ CLUSTER       │ PERFORMANCE         │ SYNC                                                    │
│ Score 100       │ Nodes 1/1     │ Latency 421ms       │ Updated 3s ago                                          │
│ API OK  Prom OK │ Sessions 0    │ Error % 0.00%       │ Polling · 30s  [↻]                                     │
│                 │               │ Throughput 0 B      │                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTROL      │                                                                                         │
│ ▸ Dashboard  │  Page content                                                                           │
│   Servers    │                                                                                         │
│   Telemetry  │                                                                                         │
│   Incidents  │                                                                                         │
│ ACCESS       │                                                                                         │
│   Users      │                                                                                         │
│   Devices    │                                                                                         │
│ ...          │                                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Top Status Bar

```
<TopStatusBar data={OperatorHealthStrip}>
  <StatusGroup title="System" aria-label="System health">
    <HealthScore value={0–100} breakdown={...} />
    <SubsystemStatus name="API" status="ok|degraded|down" />
    <SubsystemStatus name="Prometheus" status="ok|down" />
  </StatusGroup>
  <StatusGroup title="Cluster">
    <MetricCell label="Nodes" value="1/1" />
    <MetricCell label="Sessions" value={number} />
  </StatusGroup>
  <StatusGroup title="Performance">
    <MetricCell label="Latency" value="421ms" />
    <MetricCell label="Error %" value="0.00%" state="ok|degraded|down" />
    <MetricCell label="Throughput" value={formatted} />
  </StatusGroup>
  <StatusGroup title="Sync">
    <RelativeTime date={last_updated} updateInterval={5000} />
    <ModeDisplay mode="polling|stream" interval="30s" />
    <RefreshTrigger onClick={...} />
  </StatusGroup>
</TopStatusBar>
```

**File structure:**
- `frontend/admin/src/components/operator/TopStatusBar/index.tsx` — container
- `TopStatusBar/StatusGroup.tsx` — group with separator
- `TopStatusBar/HealthScore.tsx` — score + tooltip breakdown
- `TopStatusBar/SubsystemStatus.tsx` — API/Prom status
- `TopStatusBar/MetricCell.tsx` — label + value (shared with table)
- `TopStatusBar/ModeDisplay.tsx` — Polling/Stream + interval + dot

### 2.2 Sidebar

```
<Sidebar collapsed={boolean} onCollapse={fn}>
  <NavSection title="Control">
    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
    <NavItem to="/servers" icon={Server} label="Servers" />
    <NavItem to="/telemetry" icon={Activity} label="Telemetry" />
    <NavItem to="/" icon={AlertTriangle} label="Incidents" />
  </NavSection>
  <NavSection title="Access">...</NavSection>
  <NavSection title="Network">...</NavSection>
  <NavSection title="System">...</NavSection>
  <SidebarCollapseTrigger collapsed={...} onClick={...} />
</Sidebar>
```

**Types:**
```ts
type OperatorRoute = "/" | "/servers" | "/telemetry" | "/users" | "/devices" 
  | "" | "/automation" | "/billing" | "/audit" | "/settings";
```

### 2.3 Shared Operator Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MetricCell` | shared or operator | value + optional 2px microBar |
| `RelativeTime` | shared/ui (exists) | extend with `updateInterval` |
| `FreshnessBadge` | operator | fresh\|degraded\|stale, muted |
| `Placeholder` | operator | "No data" with tooltip, token-based |

---

## 3. Token Adjustments

### 3.1 New Tokens

```css
[data-console="operator"] {
  /* Status bar */
  --spacing-status-group-gap: var(--spacing-op-4);   /* 16px */
  --text-op-score: 15px;                             /* Score size */
  --text-op-nav-section: 11px;                       /* Section headers */
  --spacing-nav-section-top: var(--spacing-op-4);    /* 16px */
  
  /* Placeholder */
  --color-placeholder-text: var(--color-text-tertiary);
  --color-placeholder-bg: transparent;
}
```

### 3.2 Token Reference Table

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Spacing base | `--spacing-op-1` | 4px | 4px grid unit |
| Spacing 2 | `--spacing-op-2` | 8px | Cell padding |
| Spacing 3 | `--spacing-op-3` | 12px | Section gap |
| Spacing 4 | `--spacing-op-4` | 16px | Group gap, section top |
| Typography score | `--text-op-score` | 15px | Health score |
| Typography base | `--text-op-base` | 13px | Values |
| Typography label | `--text-op-sm` | 12px | Labels |
| Typography section | `--text-op-nav-section` | 11px | Sidebar section |
| Radius | `--radius-op` | 4px | Max radius |
| Border | `--border-subtle` | token | Dividers |

### 3.3 Removal of Violations

- Replace `6px` in admin-operator.css with `var(--spacing-op-1)` or `var(--spacing-op-2)`.
- Replace `2px` gaps with `var(--spacing-op-1)` or token.
- Replace inline `style={{...}}` with CSS classes using tokens.
- Replace `10px`, `18px` font sizes with `--text-op-*` tokens.

---

## 4. Spacing Adjustments

### 4.1 Density (10–15% reduction)

| Element | Current | Target |
|---------|---------|--------|
| operator-grid-row min-height | 88px | 80px (--spacing-op-8 * 2.5) |
| operator-grid-cell padding | var(--spacing-op-1) var(--spacing-op-2) | Keep |
| operator-section-title margin | 0 0 4px | 0 0 var(--spacing-op-1) |
| operator-traffic-toolbar margin-bottom | var(--spacing-op-2) | var(--spacing-op-1) |
| admin-nav padding | var(--spacing-op-1) var(--spacing-op-2) | Keep |
| admin-nav-section padding-top | 8px | var(--spacing-op-4) |

### 4.2 Status Bar Groups

- Gap between groups: `var(--spacing-op-4)` (16px)
- Divider: 1px `var(--border-subtle)` between groups
- Cell padding: `0 var(--spacing-op-2)`

---

## 5. Code Structure Plan

### Phase 1: Tokens & Cleanup
1. Add new tokens to `build-tokens.js` / `tokens.css`
2. Audit and replace hardcoded px, inline styles
3. Remove `style={{}}` from OperatorDashboardContent, ClusterMatrix, OperatorServerTable, IncidentPanel

### Phase 2: TopStatusBar Refactor
1. Create `TopStatusBar/` module
2. Extract `HealthScore`, `SubsystemStatus`, `MetricCell`, `ModeDisplay`
3. Use `RelativeTime` with `updateInterval={5000}` for "Updated X ago"
4. Add score breakdown tooltip
5. Deprecate `HealthStrip` (or alias to new structure)

### Phase 3: Sidebar Refactor
1. Create `Sidebar/`, `NavSection`, `NavItem`
2. Strict `OperatorRoute` union type
3. Section header: `--text-op-nav-section`, `--spacing-nav-section-top`
4. Active state: 2px left border, subtle tint
5. Collapse: icon-only 48px, tooltips

### Phase 4: Dashboard Layout
1. `Placeholder` component for empty states
2. UserSessionsBlock: 2-column metric grid
3. Traffic block: fixed height, skeleton when empty
4. Server table: `MetricCell`, `FreshnessBadge` components

### Phase 5: Storybook & Polish
1. Stories for all new components
2. Dark mode parity check
3. Interaction stability (memoization, no layout shift)

---

## 6. Storybook Updates

### New Stories

| Story | Path | Variants |
|-------|------|----------|
| TopStatusBar | operator/TopStatusBar.stories | default, degraded, down, dark |
| StatusGroup | operator/StatusGroup.stories | single, multiple cells |
| HealthScore | operator/HealthScore.stories | 100, 50, 0, tooltip |
| SubsystemStatus | operator/SubsystemStatus.stories | ok, degraded, down |
| MetricCell | operator/MetricCell.stories | value, microBar, high, medium |
| ModeDisplay | operator/ModeDisplay.stories | polling, stream |
| Sidebar | operator/Sidebar.stories | expanded, collapsed |
| NavSection | operator/NavSection.stories | with items |
| NavItem | operator/NavItem.stories | default, active, hover |
| FreshnessBadge | operator/FreshnessBadge.stories | fresh, degraded, stale |
| Placeholder | operator/Placeholder.stories | default, with tooltip |

### RelativeTime Extension

- Add `updateInterval?: number` prop
- Story: auto-updating every 5s

---

## 7. Refactor PR Breakdown

### PR 1: Token Audit & Cleanup
- Add tokens
- Replace hardcoded values
- Remove inline styles
- Risk: Low

### PR 2: TopStatusBar
- New components
- Relative time in status bar
- Mode display with interval
- Risk: Medium (status bar in header)

### PR 3: Sidebar Refactor
- NavSection, NavItem
- Collapse behavior
- Risk: Low

### PR 4: Dashboard Layout
- Placeholder, UserSessions grid, Traffic skeleton
- Risk: Low

### PR 5: Server Table & Shared Cells
- MetricCell, FreshnessBadge
- Risk: Low

### PR 6: Storybook
- All new stories
- Risk: None

---

## 8. Risk Analysis

| Risk | Mitigation |
|------|------------|
| Layout shift during refresh | Reserve min-height, skeleton states, `content-visibility` where appropriate |
| Rerender storms (RelativeTime) | `updateInterval` with single `setInterval`, unmount cleanup |
| Route type strictness | Gradual migration; `OperatorRoute` union |
| Dark mode regressions | Test each component in dark; use tokens only |
| Performance (memoization) | `React.memo` on MetricCell, StatusGroup; stable keys |

---

## 9. Before/After Reasoning

| Area | Before | After | Rationale |
|------|--------|-------|-----------|
| Status bar groups | Flat list | SYSTEM / CLUSTER / PERFORMANCE / SYNC | Cognitive chunking |
| Updated display | "14:04:24" | "3s ago" | Operator relevance |
| Mode | "polling" | "Polling · 30s" | Clarity |
| Score | Equal weight | font-weight 500, 15px | Primary signal |
| Empty states | "No data" | Placeholder + tooltip | Consistency |
| User sessions | Vertical rows | 2-column grid | Density, alignment |
| Traffic block | Variable height | Fixed + skeleton | No layout shift |
| Tokens | Some 6px, 10px | 4px grid, tokens only | DRY, consistency |
| Inline styles | Several | Zero | Maintainability |

---

## 10. Acceptance Criteria Checklist

- [ ] All styling uses design tokens
- [ ] No inline styles in operator components
- [ ] 4px spacing grid enforced
- [ ] Status bar: 4 logical groups, relative time, mode with interval
- [ ] Sidebar: section headers 11px, 16px top margin, collapse to 48px
- [ ] Dashboard: Placeholder component, 2-col UserSessions, Traffic skeleton
- [ ] Server table: MetricCell, FreshnessBadge, sticky header
- [ ] No layout shift during polling
- [ ] Dark mode parity
- [ ] Storybook coverage for new components
- [ ] Zero functional regressions
