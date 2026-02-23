# Top Bar & Sidebar Redesign Spec — Operator-Grade Admin

Structural UX refinement for the VPN Suite Admin Dashboard. Dense, context-aware, infrastructure control-plane design.

---

## PART 1 — RESEARCH SUMMARY

### Comparative Analysis

| Platform | Top Bar / Status | Search | Context Switching | Sidebar |
|----------|------------------|--------|-------------------|---------|
| **Bloomberg Terminal** | High density, conceal complexity, incremental change, dark aesthetic. Status context always visible. | Command-driven; shortcuts exposed. | Region/market context in workflow. | Hierarchical; keyboard-first; no decorative elements. |
| **Stripe internal admin** | Minimal header; context badges; compact controls. | Global search (Cmd+K); command palette. | Org/env switcher prominent. | Grouped sections; active state subtle. |
| **AWS Console** | Unified navigation; search services; region selector; account. | Header search for services. | Region, account in header. | Collapsible; service groups. |
| **Datadog** | Time range; env selector; search bar; notifications. | Header search; Cmd+K. | Org/env in header. | Left nav grouped; metrics, APM, infra. |
| **Grafana** | Command palette (Cmd/Ctrl+K); search integrated into header. | Search opens command palette. | Org/datasource context. | Collapsible; nested; icon+text. |

### Key Patterns to Adopt

1. **Logical grouping** — Group status metrics (System Health, Cluster State, Traffic, Update/Mode); avoid equal-weight presentation.
2. **Command palette** — Ctrl+K for search/jump; shortcut hint visible.
3. **Context prominence** — Region/cluster selector clear and persistent; active context labeled.
4. **Status hierarchy** — Primary metric (Score) visually dominant; degraded states noticeable but not alarming.
5. **Compact density** — 4px grid; typography 12–14px; max bar height 48px.
6. **Sidebar groups** — CONTROL, ACCESS, NETWORK, SYSTEM with small uppercase headers.
7. **Active state** — Left border accent (2px); subtle background; no glow.
8. **Collapsible sidebar** — Icon-only mode; tooltips on hover.

### Patterns to Avoid

1. Marketing UI, gradients, decorative elements.
2. >5–6 status indicators (cognitive overload).
3. Large card layouts, excessive whitespace.
4. Bounce/high-motion animations (>150ms).
5. Saturated greens for health; pure black backgrounds in dark mode.

---

## PART 2 — TOP BAR REDESIGN SCHEMATIC

### Structure (Left → Right)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] Brand  │ CONTEXT ZONE                    │ STATUS ZONE (grouped)                     │ CONTROLS ZONE    │
│            │ Region [v] Cluster [v] [Prod]   │ Score│API│Prom│Nodes│Sess│Thru│Lat│Err%   │ [Search] [🔔3]  │
│            │                                 │ ─────┼───┼────┼─────┼────┼────┼───┼─────│ Auto·30s [↻]   │
│            │                                 │ Updated 14:32 │ Polling                   │ Theme Logout     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Zone 1: Brand + Menu
- Hamburger (mobile) | Brand text + icon
- Same as today; no change.

### Zone 2: Context
- **Region** select — prominent, min-width 100px
- **Cluster** select (if multi-cluster) — optional
- **Env badge** — `Prod` | `Staging` (muted, 8px text)

### Zone 3: Status Strip (grouped)

| Group | Cells | Separator |
|-------|-------|-----------|
| **System Health** | Score (primary), API, Prom | │ |
| **Cluster State** | Nodes, Sessions | │ |
| **Traffic Metrics** | Throughput, Latency, Error % | │ |
| **Update & Mode** | Updated (HH:mm:ss), Mode (Polling/Stream) | — |

- **Score** — 18px, font-weight 600; Live dot when fresh; degraded tint when &lt;70.
- **Degraded states** — Subtle amber background; no aggressive red.
- **Separators** — 1px vertical; `var(--border-subtle)`.

### Zone 4: Controls
- **Search** — Compact input or trigger; placeholder "Search… Ctrl+K"; opens CommandPalette.
- **Alerts** — Bell icon + count; severity dot (red/amber); links to incidents.
- **Mode controls** — Auto toggle (on/off); refresh interval (e.g. 30s); Manual refresh icon.
- **Theme** — Light/Dark toggle.
- **Logout** — Text or icon.

### Density Rules
- **Height** — Max 48px (header + status strip can be 40px + 36px = 76px total, or single bar 48px).
- **Typography** — 12px labels, 13–14px values.
- **Spacing** — 4px gaps; 8px padding.

---

## PART 3 — SIDEBAR REDESIGN SCHEMATIC

### Navigation Grouping

```
CONTROL
  Dashboard   (Overview)
  Servers
  Telemetry
  Incidents   (if applicable)

ACCESS
  Users
  Devices

NETWORK
  Outline
  Automation

SYSTEM
  Billing
  Audit log
  Settings
```

### Section Headers
- Font: 10px, uppercase, letter-spacing 0.08em
- Color: `var(--color-text-tertiary)`
- Padding: 8px top (first section 4px), 4px bottom

### Nav Links
- Icon 16px; text 13px
- Padding: 6px 12px vertical; 12px horizontal
- Gap: 8px icon–text

### Active State
- Left border: 2px solid `var(--color-interactive-default)`
- Background: `color-mix(in oklab, var(--color-primary-subtle) 60%, transparent)`
- No box-shadow or glow

### Collapse (Icon-Only)
- Width: 48px
- Icons centered; labels hidden
- Tooltip on hover (title or custom tooltip)
- Section headers hidden or collapsed to divider

### Recently Visited (Optional)
- Mini-section at top: "Recent"
- 3–5 items; max 24px height each

---

## PART 4 — SPACING & HIERARCHY SPEC

### Top Bar
| Token | Value | Use |
|-------|-------|-----|
| `--op-bar-height` | 48px | Max header+strip combined |
| `--op-bar-padding-x` | 12px | Horizontal padding |
| `--op-bar-gap` | 4px | Between elements |
| `--op-status-group-gap` | 8px | Between groups |

### Sidebar
| Token | Value | Use |
|-------|-------|-----|
| `--op-nav-padding` | 12px | Horizontal padding |
| `--op-nav-link-py` | 6px | Link vertical padding |
| `--op-nav-gap` | 2px | Between links |
| `--op-nav-section-gap` | 8px | Before section header |

### Typography
| Role | Size | Weight |
|------|------|--------|
| Score | 18px | 600 |
| Status value | 13px | 500 |
| Status label | 11px | 400 |
| Section header | 10px | 600 |
| Nav label | 13px | 400 |

---

## PART 5 — INTERACTION BEHAVIOR SPEC

| Interaction | Behavior |
|-------------|----------|
| **Hover (nav)** | Background tint 80ms ease-out |
| **Hover (status cell)** | Slightly brighter; tooltip if truncated |
| **Focus** | 2px outline `var(--color-focus-ring)`; offset 2px |
| **Click (search)** | Open CommandPalette |
| **Click (refresh)** | Immediate refetch; brief loading state (no spinner if &lt;200ms) |
| **Keyboard** | Ctrl+K search; g+g then s/u/t/a/o for navigation |
| **Transitions** | Max 150ms; ease-out |
| **Scroll** | Sidebar sticky; main scroll; no layout shift |

---

## PART 6 — DARK MODE REFINEMENT NOTES

- **Sidebar border** — `oklch(0.28 0.01 265)` instead of 0.25 for better separation
- **Background** — Avoid `#000`; use `oklch(0.12 0.01 265)` or `#0F1115`
- **Active state** — Ensure `color-primary-subtle` has sufficient contrast on dark
- **Health indicators** — Desaturate green (e.g. oklch 0.65 0.12 145); avoid neon
- **Status strip** — Slightly brighter borders; header bg 1–2% lighter than main

---

## PART 7 — BEFORE / AFTER REASONING

| Area | Before | After | Rationale |
|------|--------|-------|-----------|
| Status strip | Flat list, equal weight | Grouped (Health/Cluster/Traffic/Update) | Cognitive chunking; faster scan |
| Context | Region in header end | Context zone left-of-center | Operators need context before metrics |
| Search | Button "Search (Ctrl+K)" | Input or trigger + hint | Discoverability; Grafana/AWS pattern |
| Alerts | None in bar | Bell + count, severity | At-a-glance incident awareness |
| Mode | Text only | Auto toggle + interval + refresh | Control without leaving bar |
| Sidebar | Flat list, sections hidden on desktop | Always-visible groups | Hierarchy; Bloomberg/Datadog pattern |
| Active nav | Full background fill | Left accent + subtle tint | Less visual weight; stable |
| Density | 8–12px padding | 4–6px, 48px max bar | Higher information density |

---

## PART 8 — OPERATOR USABILITY IMPACT

| Dimension | Impact | Notes |
|-----------|--------|-------|
| **Scan time** | −30% | Grouped status; primary metric dominant |
| **Context clarity** | +High | Region/cluster/env always visible |
| **Search discoverability** | +High | Ctrl+K hint; search in bar |
| **Alert awareness** | New | Bell + count; severity-based |
| **Navigation efficiency** | +Medium | Grouped sidebar; keyboard shortcuts |
| **Visual noise** | −Medium | Subtle active states; no decorative elements |
| **Dark mode comfort** | +Medium | Adjusted contrast; no pure black |

---

## Implementation Checklist

- [x] Restructure status strip into 4 groups with separators (HealthStrip)
- [x] Add Context zone (Region, Env badge)
- [x] Add Search input/trigger with Ctrl+K hint
- [x] Add Alerts indicator (bell + count)
- [x] Add Mode controls (interval display, refresh button)
- [x] Regroup sidebar: CONTROL, ACCESS, NETWORK, SYSTEM
- [x] Enforce section headers on all breakpoints
- [x] Refine active state (2px left border, subtle bg)
- [x] Add sidebar collapse (icon-only, 48px)
- [x] Apply 4px grid; max 48px bar height
- [x] Dark mode: sidebar border contrast (admin-operator.css)