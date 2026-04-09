# Adaptive UI/UX system

Production-grade responsive layout, breakpoints, tokens, and component behavior for the admin SaaS.

## Content-aware adaptive (viewport + container + data)

Layout adapts to **viewport** (breakpoints), **container size** (container queries), and **content state** (data attributes).

### Container queries

- **`admin-top-bar-center`** (`container-name: topbar-center`): Health strip wraps and reduces padding when center width &lt; 380px; single-column layout when &lt; 260px.
- **`operator-dashboard`** (`container-name: dashboard-grid`): Grid cells span full width when container &lt; 500px.
- **`operator-card`** (`container-name: card`): Charts grid switches to 1 column when card &lt; 320px, 2 columns when ≥ 400px.

### Content-driven attributes

Cards set **data-content-empty** and **data-content-dense** so layout can adapt:

- **data-content-empty="true"**: Cluster matrix, Traffic, Incidents, or Server table has no data → card uses minimal height and centered empty state.
- **data-content-dense="true"**: Server table has many rows → card allows scroll and avoids fixed height.

Banner (degraded/partial) is full width: `grid-column: 1 / -1`, inner alert `width: 100%`.

> **Note:** Container-query and content-aware styles may live in admin layout/component CSS. <!-- VERIFY: path admin/src/styles/admin-content-aware.css or equivalent -->

---

## Breakpoints (single source of truth)

> **Note:** Breakpoints are defined in theme/layout CSS. <!-- VERIFY: shared/src/theme/breakpoints.css and admin/src/styles/admin-adaptive-vars.css or current equivalents -->

| Name | Range | Behavior |
|------|--------|-----------|
| **XS** | < 640px | Mobile: single column, overlay nav, stacked cards |
| **SM** | 640–1024px | Tablet: collapsible sidebar (48px ↔ 220px) |
| **MD** | 1024–1440px | Desktop: persistent sidebar |
| **LG** | 1440–1920px | Wide |
| **XL** | > 1920px | Ultrawide; max content width 1600px |

Use **min-width** for mobile-first. Media queries use literals: **640px**, **1024px**, **1440px**, **1920px**.

## Layout tokens

- **Content:** `--content-max-width` (per breakpoint in admin-adaptive-vars).
- **Dashboard grid:** `--dashboard-cols`: 1 (XS), 2 (SM), 3 (MD), 4 (LG).
- **Spacing:** 4px base; use `--spacing-*` or `--space-1`…`--space-12` from breakpoints.css. No magic numbers in components.

## Layout primitives

- **PageContainer:** Max width, token padding, `margin: 0 auto`. Wraps main content in AdminLayout.
- **SectionContainer:** Section gap from `--spacing-section-gap`.
- **DataCard:** Metric/telemetry card (title, value, trend, freshness). Token-only spacing.

## Sidebar

| Width | Mode |
|-------|------|
| XS | Overlay (fixed, translateX; backdrop) |
| SM | Collapsible: 48px collapsed, 220px expanded; sticky |
| MD+ | Persistent; user can collapse to 48px (localStorage) |

Transitions: `transform`/`opacity` only; respect `prefers-reduced-motion`.

## Tables

- **< MD:** Horizontal scroll; sticky header; TableContainer.
- **XS:** Stacked cards for Servers, Audit, Devices (same data, no duplicate fetch).
- Always: sticky header, numeric right-align, monospace IDs, truncate + tooltip for long text.

## Charts

- **ResizeObserver** in EChart wrapper; call `getEchartsInstance().resize()` on container resize.
- **Containment:** `overflow: hidden`, `contain: paint` on chart container.
- **Tick density:** Presets accept optional `containerWidth`; smaller width → fewer axis splits (splitNumber 2–4).

## Dashboard grid

Operator dashboard: `grid-template-columns: repeat(var(--dashboard-cols), 1fr)`. Cards span 1; full-width sections span 1 / -1. Gap from `--density-section-gap`.

## Density

Modes: **compact**, **comfortable**, **spacious** (Dashboard settings). Tokens: `--density-card-padding`, `--density-row-height`, `--density-chart-gap`, `--density-section-gap`. Applied when `.dashboard--compact` / `.dashboard--comfortable` / `.dashboard--spacious` on dashboard root.

## Theme and severity

Semantic tokens in `tokens.css`; see [design/design-system.md](design/design-system.md) and [design/typography-tokens.md](design/typography-tokens.md) for token reference. Telemetry severity: pair **color + icon** (healthy=green+check, warning=amber+warning, critical=red+alert, unknown=gray+minus).

## Tests and a11y

- **Playwright:** `apps/admin-web/e2e/adaptive-ui.spec.ts` — viewports 360, 640, 1024, 1440; no horizontal scroll; sidebar overlay at XS, persistent at MD; Servers cards at XS; skip link.
- **A11y:** Keyboard nav, `:focus-visible`, ARIA landmarks, 44px min touch targets on XS/SM. See [adaptive-ui-test-plan.md](adaptive-ui-test-plan.md).
