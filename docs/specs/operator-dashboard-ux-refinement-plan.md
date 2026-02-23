# Operator Dashboard UX Refinement Plan

Deep UI/UX refinement pass for the VPN Suite Admin Dashboard. Not a redesign — refine, densify, strengthen hierarchy, and mature the operator experience.

---

## 1. Section-by-Section UX Refinement Plan

### 1.1 Top Status Strip

**Current:** Score | API | Prom | Nodes | Sessions | Throughput | Latency | Error % | Updated | Mode — grouped with separators, tooltips, degraded tint.

**Refinements:**
- **Score visual hierarchy:** Increase Score cell prominence — `font-size: var(--text-op-heading-lg)` (already 16px); add `font-weight: 600` for Score value only; optionally add `min-width: 2.5em` so Score doesn't reflow.
- **Grouping labels:** Add optional superscript group labels (Control | Cluster | Traffic | Freshness) — 8px, muted — above or inline with first cell of each group. Low priority; separators may suffice.
- **Micro deltas:** If latency/throughput deltas are available from API, show inline (e.g. `45ms ↓`). Requires backend support. Placeholder: document in tooltip.
- **Hover detail:** Extend `title` tooltips with threshold context where relevant (e.g. Error %: "Threshold: &lt;1% ok, 1–5% degraded, &gt;5% down").
- **Degraded states:** Ensure `operator-health-cell--degraded` uses slightly stronger contrast in dark mode — test `color-mix(in oklab, var(--color-op-warning) 12%, transparent)` for dark.

### 1.2 Cluster Health Matrix

**Current:** Table with Region, Total, Online, CPU %, RAM %, Users, Throughput, Error %, Health; CPU/RAM micro-bars (24×4px); threshold coloring; "No data".

**Refinements:**
- **Placeholder state:** Replace raw "No data" text with structured placeholder: `—` in muted, same cell width. Or keep "No data" but ensure `num-muted` is applied.
- **Micro-bars:** Reduce bar height to 2px per request: `.operator-micro-bar { height: 2px; }` — verify readability.
- **Sorting:** Add sortable column headers (Region, CPU, RAM, Users, Health). Use `role="button"` + `aria-sort`; store sort state in parent; no server-side sort required if client has full rows.
- **Health thresholds:** Document in codebase: CPU/RAM &gt;80% = high, 60–80% = medium; Health badge from backend.
- **Numeric alignment:** Confirm all numeric cells use `.num` and `text-align: right`.

### 1.3 Incidents Panel

**Current:** Severity badge, entity·metric: value, RelativeTime, View → link.

**Refinements:**
- **Severity:** Already present (critical/warning). Ensure badge styling is distinct but muted.
- **Affected node count:** Add if API provides (e.g. `OperatorIncident.affected_count`). Otherwise skip.
- **Empty state:** Replace "No active incidents" with lighter treatment: smaller font, more vertical padding, optional `—` placeholder row. Add class `operator-incident-empty` with `opacity: 0.7`.
- **View details:** Link already goes to `inc.link`. Ensure link is keyboard-accessible and visually consistent.

### 1.4 Traffic & Load

**Current:** TimeRangePicker + Refresh; two charts (Throughput, Connections); stale badge when &gt;2m; last datapoint label; height 160px; line width 1.5.

**Refinements:**
- **Chart height:** Keep 160px; add `min-height: 160px` to chart wrapper to prevent collapse.
- **Gridlines:** Add subtle y-axis gridlines in ECharts: `yAxis.splitLine: { show: true, lineStyle: { color: 'oklch(0.5 0 0 / 0.06)' } }`. Muted, thin.
- **Hover crosshair:** ECharts `axisPointer: { type: 'cross' }` — already line; consider cross for better precision. Verify tooltip stays crisp.
- **Last datapoint:** Already shown. Ensure it updates on refresh and uses RelativeTime.
- **Time-range selector:** Style to match operator tokens — compact, `--text-op-sm`, border `--border-subtle`. Audit TimeRangePicker component.
- **Vertical space:** Reduce gap between toolbar and charts from `--spacing-op-2` to `--spacing-op-1` if needed.

### 1.5 User Sessions Block

**Current:** 3 rows (Active; 1h Δ | Peak 24h; 24h Δ | New/min); compact grid; `--text-op-table` values.

**Refinements:**
- **Trend arrows:** Add muted up/down arrows for deltas: `↑` / `↓` when delta &gt; 0 / &lt; 0. Use `color: var(--color-text-tertiary)`; size ~0.75em.
- **Numeric alignment:** Values already right-aligned. Ensure grid columns are `auto 1fr` so values align vertically.
- **Layout symmetry:** Match Traffic block height — use `min-height` so both panels in the row have equal visual weight, or accept natural height.

### 1.6 Server Table

**Current:** Sticky header, RelativeTime for Last HB, CPU/RAM micro-bars, muted freshness, .num alignment.

**Refinements:**
- **Column widths:** Add `table-layout: fixed` or explicit `width` for Name (min 120px), IP (min 100px), Actions (min 60px). Prevent long names from squashing numerics.
- **Row hover:** Add `.operator-server-table tbody tr:hover { background: color-mix(in oklab, var(--color-background-secondary) 50%, transparent); }` — subtle.
- **Loading shimmer:** Instead of full-table replacement, render skeleton rows (same column count) with `Skeleton` component per cell. Preserve header and structure.
- **Badge tone:** Fresh badge already muted. Ensure `operator-freshness--muted` doesn't reduce legibility in dark mode.

### 1.7 Global Consistency

**Refinements:**
- **Vertical spacing:** Reduce `operator-grid-cell` padding, `operator-section-title` margin, and `operator-grid-row` min-height by ~10%. Target: `padding: var(--spacing-op-1-5)` if token exists, else `6px`; `min-height: 88px`.
- **Header typography:** Section titles `--text-op-heading` (14px); ensure no larger.
- **Border contrast:** Slightly increase border visibility in dark mode: `--color-op-border` or `border-color` with 1–2% more lightness if readability suffers.
- **Column balance:** Left (Cluster + Traffic) vs right (Incidents + Sessions) — ensure both columns scroll independently if needed; equal min-height for row pairs.

### 1.8 Data Freshness Visibility

**Refinements:**
- **Live indicator:** Add small "Live" label next to Updated when `data_status === "ok"` and last_updated &lt; 30s. Muted green dot or text.
- **Stream blink:** If `refresh_mode === "stream"`, add 4px dot with `animation: pulse 1.5s ease-in-out infinite` (opacity 0.5 ↔ 1). Minimal, non-distracting.
- **Stale indicator:** Degraded banner already shows; Top Strip Updated cell can use `operator-health-value--degraded` when age &gt; 2m if data supports it.

### 1.9 Interaction Refinement

- **Button size:** All action buttons `size="sm"`. Audit Dashboard page actions.
- **Padding:** Reduce button horizontal padding to 6px for sm if design allows.
- **Hover states:** Use `var(--color-primary-subtle)` consistently; transitions &lt;150ms.
- **Action row:** Server table Actions column — keep single Sync button; no extra padding.

### 1.10 Advanced Operator UX

- **Keyboard shortcut:** Header already shows "Search (Ctrl+K)". Ensure it's visible in operator theme.
- **Inline filter:** Add `<input>` above Server Table for filter by name/region/IP. Debounced, compact.
- **Region switcher:** Header has Region Select. Ensure styling matches operator tokens.
- **Last refresh duration:** Optional metric in Top Strip: "Refreshed in 120ms" — requires timing from React Query or fetch.

---

## 2. Updated Spacing and Typography Adjustments

### Spacing (10–15% reduction)

| Token/Element              | Current          | Proposed        |
|----------------------------|------------------|-----------------|
| operator-grid-cell padding | `--spacing-op-2` (8px) | `--spacing-op-1-5` (6px) or keep 8px |
| operator-section-title margin | `0 0 var(--spacing-op-1)` | `0 0 4px` |
| operator-grid-row min-height | 96px          | 88px            |
| operator-charts-grid gap   | `--spacing-op-3` | `--spacing-op-2` |
| operator-traffic-toolbar margin-bottom | `--spacing-op-2` | `--spacing-op-1` |

### Typography

| Role                | Token                  | Size   | Notes                    |
|---------------------|------------------------|--------|--------------------------|
| Score value         | `--text-op-heading-lg` | 16px   | + font-weight: 600       |
| Health strip values | `--text-op-base`       | 13px   | keep                     |
| Section titles      | `--text-op-heading`    | 14px   | keep                     |
| Table cells         | `--text-op-table`      | 12.5px | keep                     |
| Labels              | `--text-op-sm`         | 12px   | keep                     |

---

## 3. Improved Hierarchy Breakdown

```
Level 1 (primary):   Score (0–100) — largest, leftmost
Level 2 (control):   API, Prom — status colors, degraded tint
Level 3 (cluster):   Nodes, Sessions, Throughput — capacity
Level 4 (quality):   Latency, Error % — metrics
Level 5 (meta):      Updated, Mode — freshness
```

Section hierarchy:
- Section titles: uppercase, 14px, letter-spacing 0.05em
- Table headers: 12.5px, weight 600
- Body: 12.5px table, 13px for emphasis values

---

## 4. Refined Component-Level Adjustments

| Component       | Adjustment                                                                 |
|-----------------|----------------------------------------------------------------------------|
| HealthStrip     | Score font-weight 600; hover reveals extended tooltip; optional Live dot   |
| ClusterMatrix   | 2px micro-bars; sortable headers; placeholder "—" for empty                |
| IncidentPanel   | Empty state `operator-incident-empty`; severity badges muted               |
| Traffic/Charts  | Subtle gridlines; crosshair axisPointer; min-height 160px                  |
| UserSessions    | Trend arrows (↑↓) for deltas; symmetric layout                             |
| OperatorServerTable | Row hover; column min-widths; skeleton loading; filter input           |
| TimeRangePicker | Compact styling; operator tokens                                           |
| Buttons         | sm size; reduced padding where appropriate                                 |

---

## 5. Table Layout Improvement Spec

### Cluster Matrix

- `table-layout: auto` (default) acceptable for variable regions.
- Header: sticky not required (table is short).
- Row height: 32px (`--table-row-height-op`).
- Cell padding: `--spacing-op-1` vertical, `--spacing-op-2` horizontal.
- Sort: Click header to toggle asc/desc; store in React state; sort client-side.

### Server Table

- `table-layout: fixed` with `width: 100%`; column widths: Name 20%, Region 10%, IP 12%, Status 8%, CPU 6%, RAM 6%, Users 5%, Throughput 8%, Last HB 8%, Freshness 8%, Actions 9%.
- Sticky header: `position: sticky; top: 0; z-index: 1; background: var(--color-background-secondary)`.
- Row hover: `background: color-mix(in oklab, var(--color-background-secondary) 50%, transparent)`.
- Ellipsis: `max-width`, `overflow: hidden`, `text-overflow: ellipsis` on Name, IP; `title` for full value.

---

## 6. Interaction Behavior Spec

| Interaction      | Behavior                                                                   |
|------------------|----------------------------------------------------------------------------|
| Hover (cells)    | No change for metrics; subtle tint for clickable (links, buttons)          |
| Hover (table row)| Light background tint                                                      |
| Click (sort)     | Toggle sort direction; instant reorder                                     |
| Click (Sync)     | Immediate feedback; loading state on button                                |
| Focus            | Visible focus ring (`outline: 2px solid var(--color-focus-ring)`)          |
| Transitions      | &lt;150ms; `ease-out`                                                       |
| Polling          | No layout shift; preserve scroll position                                  |

---

## 7. Dark Mode Refinement Notes

- **Table headers:** Use `--color-background-secondary` (oklch 0.18) — ensure it's not pure black. If `#0F1115` is bg, header should be `oklch(0.20 0.01 265)` for subtle contrast.
- **Borders:** Slightly brighter than bg: `oklch(0.30 0.01 265)` instead of 0.28 if needed.
- **Status colors:** Ensure `--color-op-success`, `--color-op-warning`, `--color-op-error` meet WCAG contrast on dark bg. Reduce saturation if too vibrant.
- **Pure black:** Avoid `#000`; use `#0F1115` or `oklch(0.12 0.01 265)`.
- **Scrollbars:** Use overlay scrollbars or styled thin scrollbars to avoid breaking rhythm.

---

## 8. Before/After Reasoning

| Area           | Before                         | After                                | Rationale                                   |
|----------------|--------------------------------|--------------------------------------|---------------------------------------------|
| Score          | Same size as other cells       | Larger, bolder                       | Primary at-a-glance signal                   |
| Micro-bars     | 4px height                     | 2px (optional)                       | Density; less visual weight                  |
| Cluster sort   | None                           | Client-side sort                     | Operator efficiency                          |
| Incident empty | Plain text                     | Lighter, padded                      | Calm empty state                             |
| Chart grid     | None                           | Subtle gridlines                     | Readability without clutter                  |
| Row hover      | None                           | Subtle tint                          | Scanability                                 |
| Loading        | Whole table replaced           | Skeleton rows                        | No layout shift; stable structure            |
| Spacing        | 8px/12px gaps                  | 6–8px reduced                        | Higher information density                   |
| Live indicator | None                           | Small "Live" when fresh              | Confidence in data freshness                 |

---

## 9. Visual Density Improvement Score

| Dimension           | Current (1–10) | Target | Notes                                      |
|---------------------|----------------|--------|--------------------------------------------|
| Information density | 7              | 8.5    | Reduce padding, add sort, filter           |
| Hierarchy clarity   | 7.5            | 9      | Score prominence, grouping                 |
| Scanability         | 7              | 8.5    | Row hover, alignment, micro-bars           |
| Calm/authority      | 8              | 9      | Muted badges, no noise                     |
| Consistency         | 8              | 9      | 4px grid, token discipline                 |

**Overall target:** 8.5/10 (operator-grade, Bloomberg-adjacent).

---

## Implementation Checklist

- [ ] Score font-weight 600
- [ ] Cluster matrix: 2px micro-bars, sortable headers
- [ ] Incident empty state styling
- [ ] Chart gridlines, crosshair
- [ ] User sessions trend arrows
- [ ] Server table: row hover, column widths, filter input, skeleton loading
- [ ] Vertical spacing reduction (~10%)
- [ ] Live indicator when data fresh
- [ ] Dark mode border/header contrast pass
- [ ] Keyboard shortcut visibility