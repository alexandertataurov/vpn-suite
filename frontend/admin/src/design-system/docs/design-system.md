# Primitives — Admin Dashboard Design System
**Version 2.0 · Dark Terminal Aesthetic · AI-Agent Ready**

> Design decisions follow [Design Principles](design-principles.md); read them before extending the system.
>
> Single source of truth for the industrial-minimal admin dashboard. Covers tokens, typography, color, layout, all 29 components, dashboard patterns, charts, motion, and the full workflow for building new components. All rules are derived from the canonical reference implementations: `dashboard-improved.html`, `primitives.html`, and `primitives-extended.html`.

---

## Contents

### Foundation
1. [System Identity & Philosophy](#1-system-identity--philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Color & Semantic System](#4-color--semantic-system)

### Layout
5. [Page Architecture](#5-page-architecture)
6. [Spacing & Density](#6-spacing--density)
7. [Responsive Behavior](#7-responsive-behavior)

### Components
8. [Base Components — v1](#8-base-components--v1)
9. [Extended Components — v2](#9-extended-components--v2)
10. [Dashboard Patterns](#10-dashboard-patterns)
11. [Charts & Data Visualization](#11-charts--data-visualization)

### Behavior
12. [Motion & Animation](#12-motion--animation)
13. [Accessibility](#13-accessibility)
14. [Forms & Interactivity](#14-forms--interactivity)

### Governance
15. [Creating New Components](#15-creating-new-components)
16. [Anti-Patterns](#16-anti-patterns)
17. [QA & PR Checklist](#17-qa--pr-checklist)

### Reference
18. [AI Agent Quick Reference](#18-ai-agent-quick-reference)
19. [Glossary](#19-glossary)

---

## 1. System Identity & Philosophy

### Identity

| Property | Value |
|---|---|
| System name | Primitives |
| Version | 2.0.0 |
| Theme | Dark terminal — dark-first, calibrated for dark backgrounds only |
| Font — UI | IBM Plex Mono |
| Font — Body | IBM Plex Sans |
| Dependencies | None — pure HTML/CSS/JS |
| Total components | 29 (v1: 14 base · v2: 18 extended) |
| Semantic variants | 6 (neutral · success · warning · danger · info · accent) |
| Size scale | 3 (sm / md / lg) |
| File references | `primitives.html` · `primitives-extended.html` · `typography.html` · `dashboard-improved.html` |

### Five Core Principles

**1. Dark-first.** Every surface, color, and contrast ratio is calibrated exclusively for dark backgrounds. There is no light mode. All surfaces must use `--bg` or `--surface-*` tokens.

**2. Monospace-forward.** IBM Plex Mono is the primary typeface for all UI chrome: buttons, badges, labels, navigation, data values, and identifiers. IBM Plex Sans is reserved for multi-sentence body copy only — never for metrics, statuses, or interactive labels.

**3. Token-driven.** Every color, spacing, radius, and font value is a CSS custom property. Hardcoding hex values anywhere except `:root` is a build-breaking violation. This is what makes the system AI-generatable, refactorable, and consistent.

**4. Semantic-first.** Component variants don't describe appearance — they describe meaning. `badge-success` doesn't mean "green badge"; it means "this thing is in a healthy state." Color is a consequence of semantics, not a choice.

**5. Data-legibility over aesthetic.** Every visual decision — density, truncation strategy, color intensity, motion timing — is made in service of an operator reading live infrastructure data at a glance. Decorative choices are always wrong.

### What This System Is Not

- Not a marketing UI — no gradients, no rounded cards, no large hero imagery
- Not a consumer UI — density is high, information is primary, visual flourish is absent
- Not a component-first system — layout and data patterns are first-class concerns alongside individual components

---

## 2. Design Tokens

Tokens are the single source of truth for all visual decisions. The canonical token file is `tokens/tokens.css`. All other CSS files import from it — they never redeclare values.

### Token Declaration

Add this block to `:root` on every page. Never add individual token overrides elsewhere.

```css
:root {
  /* ────────────────────────────────────────────────
     SURFACES  —  6 elevation levels
     Rule: never place two same-level surfaces adjacent
     without a border between them.
  ──────────────────────────────────────────────── */
  --bg:        #0c0e10;   /* page root only */
  --s0:        #0e1114;   /* topbar, sidebar, status bar */
  --s1:        #111518;   /* cards, inputs, stat cards */
  --s2:        #161b1f;   /* hover states, adornments, table rows */
  --s3:        #1b2126;   /* active/pressed, tooltips, modal bg */
  --s4:        #202830;   /* meter tracks, progress tracks, skeletons */

  /* Primitives-canonical aliases (tokens.css) */
  --surface-1: #121618;
  --surface-2: #171b1e;
  --surface-3: #1d2226;
  --surface-4: #232a2f;

  /* ────────────────────────────────────────────────
     BORDERS  —  4 levels + focus ring
  ──────────────────────────────────────────────── */
  --bd-sub:    #161d22;   /* hairline dividers, section separators */
  --bd-def:    #1e272e;   /* default border on all cards + components */
  --bd-hi:     #28343c;   /* hover/elevated borders */
  --bd-focus:  #3a8cff;   /* focus rings — all focusable elements */

  --border-subtle:  #1e2428;
  --border-default: #252b30;
  --border-bright:  #2e363c;
  --border-focus:   #3a8cff;

  /* ────────────────────────────────────────────────
     TEXT  —  4 levels + inverse
  ──────────────────────────────────────────────── */
  --tx-pri:  #c0cdd6;   /* headings, values, emphasis */
  --tx-sec:  #6a8898;   /* body text, secondary labels */
  --tx-mut:  #384f5e;   /* metadata, section labels, placeholders */
  --tx-dim:  #1e2c34;   /* disabled text, y-axis labels, ghost text */

  --text-primary:   #c8d2da;
  --text-secondary: #8a9aa8;
  --text-muted:     #4e5e6a;
  --text-disabled:  #313c44;
  --text-inverse:   #0d0f10;   /* text on solid interactive buttons */

  /* ────────────────────────────────────────────────
     SEMANTIC COLORS
     Each exports 3 tokens: base · dim (8% fill) · border (22%)
     Always use all three together — never color alone.
  ──────────────────────────────────────────────── */

  /* Interactive / Blue */
  --blue:               #3a8cff;
  --blue-d:             rgba(58,140,255,.07);
  --blue-b:             rgba(58,140,255,.18);
  --interactive:        #3a8cff;
  --interactive-dim:    rgba(58,140,255,.08);
  --interactive-border: rgba(58,140,255,.22);

  /* Success / Green */
  --green:          #32b05a;
  --green-d:        rgba(50,176,90,.07);
  --green-b:        rgba(50,176,90,.18);
  --success:        #3dba6a;
  --success-dim:    rgba(61,186,106,.08);
  --success-border: rgba(61,186,106,.22);

  /* Warning / Amber */
  --amber:          #d49018;
  --amber-d:        rgba(212,144,24,.07);
  --amber-b:        rgba(212,144,24,.18);
  --warning:        #e8a020;
  --warning-dim:    rgba(232,160,32,.08);
  --warning-border: rgba(232,160,32,.22);

  /* Danger / Red */
  --red:          #d04040;
  --red-d:        rgba(208,64,64,.07);
  --red-b:        rgba(208,64,64,.18);
  --danger:       #e85050;
  --danger-dim:   rgba(232,80,80,.08);
  --danger-border:rgba(232,80,80,.22);

  /* Info */
  --info:        #4a9ee8;
  --info-dim:    rgba(74,158,232,.08);
  --info-border: rgba(74,158,232,.22);

  /* Accent / Violet */
  --violet:       #7850cc;
  --violet-d:     rgba(120,80,204,.07);
  --violet-b:     rgba(120,80,204,.18);
  --accent:       #a070e8;
  --accent-dim:   rgba(160,112,232,.08);
  --accent-border:rgba(160,112,232,.22);

  /* Teal — identifier color, read-only data only */
  --teal: #2490b8;

  /* ────────────────────────────────────────────────
     CHART COLORS  —  fixed hex values used in SVG
  ──────────────────────────────────────────────── */
  --chart-blue:   #4878e8;
  --chart-violet: #7858d8;

  /* ────────────────────────────────────────────────
     TYPOGRAPHY
  ──────────────────────────────────────────────── */
  --font-mono: 'IBM Plex Mono', monospace;
  --font-sans: 'IBM Plex Sans', sans-serif;

  /* ────────────────────────────────────────────────
     GEOMETRY
  ──────────────────────────────────────────────── */
  --r:    2px;   /* interactive components */
  --rc:   3px;   /* cards, panels, overlays */
  --r-sm: 2px;
  --r-md: 3px;
  --r-lg: 6px;   /* large containers (v2) */

  /* ────────────────────────────────────────────────
     SPACING SCALE
  ──────────────────────────────────────────────── */
  --sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 20px;  --sp-6: 24px;  --sp-8: 32px;
}
```

### Surface Hierarchy

Surfaces express elevation through color progression, not shadow. Each level is darker than the one above it to maintain dark-terminal legibility.

| Token | Hex | Used on | Rule |
|---|---|---|---|
| `--bg` | `#0c0e10` | Page root `<body>` only | Never on any component |
| `--s0` | `#0e1114` | Topbar, sidebar, status bar | Shell chrome only |
| `--s1` | `#111518` | All cards, inputs, stat cards | Default component background |
| `--s2` | `#161b1f` | Hover states, table rows, adornments | Hover and inset only |
| `--s3` | `#1b2126` | Active/pressed, tooltips, modal backgrounds | Overlay/pressed only |
| `--s4` | `#202830` | Meter tracks, progress tracks, skeleton placeholder | Deepest inset only |

**The adjacency rule:** Two components at `--s1` must always be separated by a `1px var(--bd-def)` border. The eye needs the signal. Without it, surfaces look like one undifferentiated mass.

**The elevation rule:** Elevation is communicated through surface-step + border-color change — never `box-shadow`. Exception: modals, drawers, and the command palette use `box-shadow: 0 24px 64px rgba(0,0,0,.6)` exclusively for overlay-layer separation, not for depth within the page.

### Border Hierarchy

| Token | Hex | Used on |
|---|---|---|
| `--bd-sub` | `#161d22` | Hairline separators inside cards, section dividers, sidebar borders |
| `--bd-def` | `#1e272e` | Default outer border on all cards and components |
| `--bd-hi` | `#28343c` | Hover state border, elevated/focused borders |
| `--bd-focus` | `#3a8cff` | Focus ring color on all focusable elements (2px box-shadow) |

### Token Naming Aliases

Two parallel naming schemes exist: the short dashboard aliases (`--s*`, `--bd-*`, `--tx-*`) and the Primitives-canonical long names (`--surface-*`, `--border-*`, `--text-*`). Both map to identical hex values. Use whichever matches the file you're editing — never mix them within the same component's CSS.

---

## 3. Typography

### Font Loading

Add to `<head>` before any stylesheets:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

Weights loaded: Mono — 300, 400, 500, 600, 700 + italic 300. Sans — 300, 400, 500.

### Body Default

```css
body {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--tx-pri);
  background: var(--bg);
}
```

### Font Assignment by Context

The font-choice rule is simple: **everything is mono except multi-sentence body copy**.

| Context | Font | Color default | Notes |
|---|---|---|---|
| Buttons, badges, labels | `--font-mono` | semantic | Always uppercase |
| KPI values, all numbers | `--font-mono` | `--tx-pri` | `tabular-nums` where available |
| Node names, IDs, paths | `--font-mono` | `--teal` | Read-only identifier color |
| Nav items | `--font-mono` | `--tx-mut` | Active state → `--blue` |
| Section labels | `--font-mono` | `--tx-mut` | Always uppercase, wide tracking |
| Card titles, subtitles | `--font-mono` | `--tx-pri` / `--tx-dim` | |
| Table headers | `--font-mono` | `--tx-mut` | Uppercase, 9–10px |
| Table values | `--font-mono` | `--tx-sec` | |
| Timestamps, metadata | `--font-mono` | `--tx-mut` | |
| Body copy (>1 sentence) | `--font-sans` | `--tx-sec` | Only context for sans |
| Alert descriptions | `--font-sans` | `--tx-sec` | Multi-line prose |
| Input hint text (single line) | `--font-mono` | `--tx-mut` | |
| Input hint text (multi-line) | `--font-sans` | `--tx-mut` | |

### Type Scale

The entire system uses 8 font sizes. Every value must come from this list.

```
Size  Weight  Tracking   Used for
────  ──────  ─────────  ──────────────────────────────────────────
36px  600     -0.025em   Hero KPI / display value (largest on page)
22px  600     -0.020em   Chart axis value, prominent secondary number
18px  600     -0.015em   Page title (`.ph-title`, `type-h1`)
14px  600     -0.010em   Sub-value, incident cell value, modal title
11px  400      0.000em   Input value, code block, body default
10px  400     +0.020em   Nav item, node name, table cell, body small
 9px  400      0.000em   Body-xs, hint text, body-sans at small sizes
 8px  500–600 +0.100em   Label, badge, chip, meta, button — UPPERCASE
```

### Three-Tier Card Hierarchy

Every card — KPI, stat, widget — must implement exactly three distinct typographic tiers. This is what creates scannability: the eye reads tier 2 first, then tier 1 for context, then tier 3 for detail.

```
TIER 1 — Category label
  8px · 600 · letter-spacing: 0.12em · UPPERCASE · color: --tx-mut
  Example: "SESSIONS", "AVG LATENCY", "NODES ONLINE"

TIER 2 — Primary value
  22–36px · 600 · letter-spacing: -0.025em · color: --tx-pri
  Example: "11", "142ms", "99.8%"

TIER 3 — Supporting metadata
  8px · 500 · letter-spacing: 0.06em · UPPERCASE · color: semantic
  Example: chips, delta badges, sub-metrics
```

Never compress a card to two tiers (missing label or missing meta). Never expand to four (extra label).

### React Typography Classes

All React dashboard components pull typographic styles from `src/design-system/typography.css`. Use these named classes — don't invent font-size overrides.

| Content | Class | Component | Spec |
|---|---|---|---|
| Page title | `type-h1` | `SectionTitle` | 18–22px mono 600 |
| Section heading | `type-h2` / `type-h3` | `SectionTitle` | 16–18px mono 600 |
| Card / widget title | `type-h4` | `CardTitle` | 13–14px mono 600 |
| Body copy | `type-body` | — | 12–13px sans 400 |
| Body small | `type-body-sm` / `type-body-xs` | — | 10–11px sans 400 |
| Navigation labels | `type-nav` | `.nav-rail__label` | 10px mono |
| Metadata / timestamps | `type-meta` | `MetaText` | 8–9px mono, muted |
| Primary KPI value | `type-data-xl` | `KpiValue` | 32–36px mono 600 |
| Secondary value | `type-data-lg` / `type-data-md` | `KpiValue` | 18–22px mono 600 |
| Delta / trend | `type-delta` | — | 8px mono, semantic color |
| Log entries | `type-log` | — | 10–11px mono, muted time + colored level |

---

## 4. Color & Semantic System

### The Semantic Color Model

Colors in this system are never chosen for aesthetics. They encode operational state. An engineer reading the dashboard at 2am should understand the state of every metric without reading a label.

| Color | Signal | Correct uses | Wrong uses |
|---|---|---|---|
| `--blue` / `--interactive` | Interactive · Selected | Active nav item, focus rings, primary CTA button, selected row | Decoration, non-interactive emphasis |
| `--green` / `--success` | Healthy · Online · Complete | Online status dot, success badge, fresh telemetry, completed task | In-progress or pending states |
| `--amber` / `--warning` | Degraded · At-risk · Warning | Warning count badge, elevated CPU, degraded service, pulsing status | Critical failures, successful states |
| `--red` / `--danger` | Error · Offline · Destructive | Offline node, error count, delete action button, critical incident | Warnings or degraded (use amber instead) |
| `--violet` / `--accent` | Secondary metric · Special | Chart line 2, latency card accent, accent badge | Primary interactive elements |
| `--teal` | Identifier · Read-only | Node names, service IDs, version strings, file paths, endpoints | Status indicators, interactive elements |

### The Semantic Triplet

Every semantic color must appear in three simultaneous layers. Using color alone — without the fill and border — creates an isolated highlight that looks broken against the dark backgrounds.

```css
/* ✓ Correct — all three layers together */
.status-warning {
  color:      var(--amber);        /* text / icon */
  background: var(--amber-d);      /* 7% fill */
  border:     1px solid var(--amber-b);  /* 18% border */
}

/* ✗ Wrong — color alone, no fill context */
.status-warning {
  color: var(--amber);
}

/* ✗ Wrong — fill without matching border */
.status-warning {
  color:      var(--amber);
  background: var(--amber-d);
  /* missing border */
}
```

This applies to: badges, chips, alert panels, table row accents, KPI card edges, button semantic variants, inline status pills.

### Semantic Fill Opacity Cap

Semantic background fills must never exceed 8–10% opacity. At higher opacity they overpower the dark surface and destroy text contrast.

```css
/* Token values already set correctly — use these, don't override */
--success-dim:  rgba(61,186,106,.08);    /* ✓ 8% */
--warning-dim:  rgba(232,160,32,.08);    /* ✓ 8% */
--danger-dim:   rgba(232,80,80,.08);     /* ✓ 8% */

/* ✗ Never do this — 20% is far too strong */
background: rgba(61,186,106,.20);
```

### Left-Edge Accent System

Every KPI card and chart card carries a `2px` colored left edge that communicates what type of data the card contains. This is distinct from the semantic triplet — it's a categorization signal, not an operational state signal.

```css
/* Base edge mechanism — uses CSS custom property cascade */
.card.edge::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--ec, var(--bd-def));
  border-radius: var(--rc) 0 0 var(--rc);
}

/* Color utility classes — add alongside .card.edge */
.eb { --ec: var(--blue);   }   /* sessions, active connections, primary interactive */
.eg { --ec: var(--green);  }   /* health, freshness, uptime, success signal */
.ea { --ec: var(--amber);  }   /* incidents, warnings, risk signals */
.er { --ec: var(--red);    }   /* errors, offline nodes, critical state */
.ev { --ec: var(--violet); }   /* latency, secondary metrics, chart 2 */
.et { --ec: var(--teal);   }   /* cluster load, infrastructure, identifiers */
```

Required: `position: relative` and `overflow: hidden` on every `.card`.

### Edge Color Assignment Guide

| Card content | Class | Reasoning |
|---|---|---|
| Sessions, active peers, connections | `.eb` | Primary interactive metric |
| Health score, uptime, freshness | `.eg` | Success / healthy signal |
| Incident count, warning summary | `.ea` | Risk signal — not yet critical |
| Error count, offline node count | `.er` | Critical / failure signal |
| Latency (P50/P99), secondary chart | `.ev` | Secondary metric, violet chart line |
| Cluster CPU/RAM, infrastructure load | `.et` | Infrastructure / ops category |
| Throughput, bandwidth | `.et` or `.eb` | Infrastructure (teal) or interactive (blue) based on context |

### Status Dot Specification

Status dots are the most spatially compact state signal. Five pixels of information — use them correctly.

| State | Color | Size | Animation | Use when |
|---|---|---|---|---|
| Online / ok | `--green` | 5×5px | None — static | Service is healthy and responding |
| Degraded / warning | `--amber` | 5×5px | `ringpulse 2s infinite` | Service is responding but with elevated error rate / latency |
| Offline / error | `--red` | 5×5px | None — static | Service is not responding |
| Live / streaming | `--green` | 5×5px | `ringpulse 2s infinite` | Data is actively streaming in |
| Stale / unknown | `--tx-dim` | 5×5px | None | Last-seen > threshold, state uncertain |

**Warning dots must always pulse.** A static amber dot looks identical to a decorative element. The pulse communicates active degraded state — something needs attention.

**Error dots must never pulse.** A pulsing red dot implies "active error happening right now." A static red dot implies "this is broken." For most offline states, the condition is static.

### Neutral / Structural Color

Not everything needs a semantic color. Structural chrome (borders, separators, surface backgrounds, muted labels) uses neutral tokens:

```css
/* Structural — use for non-semantic content */
color:      var(--tx-mut);       /* muted label */
color:      var(--tx-sec);       /* secondary body */
background: var(--s2);           /* elevated surface */
border:     1px solid var(--bd-def);  /* default border */
```
---

## 5. Page Architecture

Every dashboard page uses the same three-zone CSS Grid. Never build a page with an ad-hoc layout — use this shell.

### Page structure (React)

Every dashboard page **must** be wrapped in the shared **PageLayout** component (from `@/layout/PageLayout`). PageLayout provides the `.page` container, optional page head (title, description, actions), and consistent spacing. The only exception is the login page and any other full-screen, non-dashboard route.

- **Rule:** The root return of every feature page under `features/**/*Page.tsx` (except `LoginPage`) must be `<PageLayout ...>...</PageLayout>`.
- **Spacing:** Use only design tokens (`--sp-1` … `--sp-8`) for margins and gaps; no arbitrary values.
- **Typography:** Use design-system typography components (`SectionTitle`, `MetaText`, `PageTitle`) or token-based classes (`type-h1`, `type-meta`, `type-body`); no raw font-size overrides in page code.
- **Containers:** All main content lives inside PageLayout; do not add standalone padding wrappers (e.g. raw `<div className="p-8">`).

### Shell Grid

```
┌──────────────────────────────────────────────────────────┐
│  TOPBAR (42px, sticky, z-index: 200, spans full width)   │
├─────────────────┬────────────────────────────────────────┤
│                 │  PAGE HEAD                             │
│   SIDEBAR       │  ─────────────────────────────────     │
│   (192px)       │  KPI ROW  [5 × stat cards]            │
│   sticky        │  ─────────────────────────────────     │
│   top: 42px     │  CHART ROW  [3 charts + 1 list]       │
│                 │  ─────────────────────────────────     │
│                 │  DATA TABLES                           │
│                 │  ─────────────────────────────────     │
│                 │  STATUS BAR                            │
└─────────────────┴────────────────────────────────────────┘
```

```css
.shell {
  display: grid;
  grid-template-columns: 192px 1fr;
  grid-template-rows: 42px 1fr;
  min-height: 100vh;
}

/* Topbar spans both columns */
.topbar {
  grid-column: 1 / -1;
  height: 42px;
  position: sticky;
  top: 0;
  z-index: 200;
}

/* Sidebar sticks below topbar */
.sidebar {
  position: sticky;
  top: 42px;
  height: calc(100vh - 42px);
  overflow-y: auto;
  scrollbar-width: thin;
}

/* Main content area */
.main {
  padding: 20px 18px 48px;
  overflow-y: auto;
  background: var(--bg);
}
/* Extra bottom padding prevents status bar clipping at viewport edge */
```

### Topbar

The topbar is the identity and control strip. Content order is fixed — do not reorder.

**Left to right:** Wordmark → Breadcrumb → `(flex spacer: margin-left: auto)` → Live clock → Live status chip → Action buttons → Avatar → Sign out

```html
<header class="topbar">
  <div class="tb-brand">Primitives<em>/</em>Monitor</div>
  <div class="tb-crumb">Infrastructure › <b>Overview</b></div>
  <div class="tb-right">
    <span class="tb-time" id="clock"></span>
    <div class="live-chip">
      <div class="ring pulse"></div>Live
    </div>
    <button class="tb-btn">Refresh</button>
    <button class="tb-btn">Settings</button>
    <div class="tb-avatar">OP</div>
    <button class="tb-btn">Sign out</button>
  </div>
</header>
```

```css
.topbar {
  background: var(--s0);
  border-bottom: 1px solid var(--bd-sub);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 0;
}
.tb-brand {
  font: 600 10px var(--font-mono);
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--tx-sec);
  padding-right: 16px;
  border-right: 1px solid var(--bd-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.tb-brand em { font-style: normal; color: var(--blue); }
.tb-crumb {
  font: 400 9px var(--font-mono);
  color: var(--tx-mut);
  padding-left: 14px;
}
.tb-crumb b { color: var(--tx-sec); font-weight: 400; }
.tb-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
}
.tb-time {
  font: 400 9px var(--font-mono);
  color: var(--tx-mut);
  letter-spacing: .04em;
  padding-right: 4px;
}
.live-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 500 8px var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--green);
  background: var(--green-d);
  border: 1px solid var(--green-b);
  border-radius: 20px;
  padding: 3px 9px;
}
.ring {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
}
.ring.pulse { animation: ringpulse 2s ease infinite; }
.tb-btn {
  height: 24px;
  padding: 0 10px;
  font: 500 8px var(--font-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  background: var(--s2);
  border: 1px solid var(--bd-def);
  color: var(--tx-sec);
  border-radius: var(--r);
  transition: border-color .1s, color .1s;
}
.tb-btn:hover { border-color: var(--bd-hi); color: var(--tx-pri); }
.tb-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--blue-d);
  border: 1px solid var(--blue-b);
  color: var(--blue);
  font: 600 9px var(--font-mono);
  letter-spacing: .04em;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Sidebar

The sidebar must always contain: brand/logo area → section labels → nav items with active state → footer with version and uptime.

```html
<aside class="sidebar">

  <!-- Brand / logo -->
  <div class="sb-logo">
    <div class="sb-logo-icon">P</div>
    <span class="sb-logo-name">Primitives</span>
  </div>

  <!-- Nav section -->
  <span class="sb-section">Monitor</span>

  <a href="#" class="nav-a on">
    <svg width="13" height="13"><!-- icon --></svg>
    Overview
  </a>
  <a href="#" class="nav-a">
    <svg width="13" height="13"><!-- icon --></svg>
    Incidents
    <span class="nb">3</span>   <!-- only when count > 0 -->
  </a>
  <a href="#" class="nav-a">Telemetry</a>
  <a href="#" class="nav-a">Servers</a>

  <span class="sb-section">Config</span>
  <a href="#" class="nav-a">Settings</a>
  <a href="#" class="nav-a">Users</a>

  <!-- Footer — always at bottom -->
  <div class="sb-foot">
    <div class="sb-foot-row">
      <div class="dot" style="background:var(--green);"></div>
      v2.4.1 · All systems
    </div>
    <div class="sb-foot-row" style="color:var(--tx-dim);">
      Uptime 14d 6h 22m
    </div>
  </div>

</aside>
```

```css
.sidebar {
  background: var(--s0);
  border-right: 1px solid var(--bd-sub);
  display: flex;
  flex-direction: column;
  padding: 18px 0 14px;
  width: 192px;
  flex-shrink: 0;
}

/* Section label */
.sb-section {
  font: 600 8px var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--tx-dim);
  padding: 0 14px 5px;
  margin-top: 14px;
}
.sb-section:first-of-type { margin-top: 6px; }

/* Nav item */
.nav-a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  font: 400 10px var(--font-mono);
  letter-spacing: .02em;
  color: var(--tx-mut);
  border-left: 2px solid transparent;
  text-decoration: none;
  transition: color .1s ease, background .1s ease;
}
.nav-a:hover { color: var(--tx-sec); background: rgba(255,255,255,.02); }
.nav-a.on {
  color: var(--blue);
  background: var(--blue-d);
  border-left-color: var(--blue);
}
.nav-a svg { width: 13px; height: 13px; opacity: .55; flex-shrink: 0; }
.nav-a.on svg { opacity: 1; }

/* Nav badge (counts only) */
.nb {
  margin-left: auto;
  font: 600 8px var(--font-mono);
  letter-spacing: .04em;
  color: var(--amber);
  background: var(--amber-d);
  border: 1px solid var(--amber-b);
  padding: 1px 5px;
  border-radius: 2px;
}

/* Footer */
.sb-foot {
  margin-top: auto;
  padding: 12px 14px 0;
  border-top: 1px solid var(--bd-sub);
}
.sb-foot-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 400 8px var(--font-mono);
  color: var(--tx-mut);
  letter-spacing: .04em;
  margin-bottom: 5px;
}
```

### Page Head

Every page starts with a `.ph` block containing the title, live metadata line, and action buttons.

```html
<div class="ph">
  <div>
    <div class="ph-title">Overview</div>
    <div class="ph-meta">
      <div class="dot" style="background:var(--green);width:4px;height:4px;border-radius:50%;"></div>
      <span id="last-upd">Last updated just now</span>
      <span class="sep">·</span>
      <span>11 peers connected</span>
      <span class="sep">·</span>
      <span>prod-us-east-1</span>
    </div>
  </div>
  <div class="ph-actions">
    <button class="act">Export</button>
    <button class="act">Settings</button>
    <button class="act hi">Refresh</button>
  </div>
</div>
```

```css
.ph {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}
.ph-title {
  font: 600 18px var(--font-mono);
  letter-spacing: -.015em;
  color: var(--tx-pri);
  margin-bottom: 5px;
}
.ph-meta {
  font: 400 8px var(--font-mono);
  letter-spacing: .06em;
  color: var(--tx-mut);
  display: flex;
  align-items: center;
  gap: 7px;
}
.ph-meta .sep { color: var(--bd-hi); }
.ph-actions { display: flex; align-items: center; gap: 6px; }

/* Action buttons */
.act {
  height: 26px;
  padding: 0 11px;
  font: 600 8px var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
  background: var(--s2);
  border: 1px solid var(--bd-def);
  color: var(--tx-sec);
  border-radius: var(--r);
  transition: border-color .1s, color .1s;
}
.act:hover { border-color: var(--bd-hi); color: var(--tx-pri); }
.act.hi { background: var(--blue-d); border-color: var(--blue-b); color: var(--blue); }
.act.hi:hover { background: rgba(58,140,255,.12); }
```

### Section Header

Used before every group of cards or every table. The horizontal rule visually anchors the section label to the content below it.

```html
<div class="shead">
  <div class="shead-label">System Status</div>
  <div class="shead-line"></div>
  <div class="shead-note">Last 1 hour</div>      <!-- optional -->
  <span class="shead-count">12</span>             <!-- optional count pill -->
  <span class="shead-count alert">3</span>        <!-- alert count: red variant -->
</div>
```

```css
.shead {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 7px;
}
.shead-label {
  font: 600 8px var(--font-mono);
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--tx-mut);
  white-space: nowrap;
}
.shead-line { flex: 1; height: 1px; background: var(--bd-sub); }
.shead-note {
  font: 400 8px var(--font-mono);
  letter-spacing: .05em;
  color: var(--tx-mut);
  white-space: nowrap;
}
.shead-count {
  font: 600 9px var(--font-mono);
  padding: 1px 7px;
  background: var(--s2);
  border: 1px solid var(--bd-hi);
  color: var(--tx-sec);
  border-radius: 2px;
  white-space: nowrap;
}
.shead-count.alert {
  background: var(--red-d);
  border-color: var(--red-b);
  color: var(--red);
}
```

### Status Bar

Fixed at the bottom of `.main`. Contains quick-nav links and system metadata.

```html
<div class="statusbar">
  <div class="sb-ql-label">Quick links</div>
  <div class="sb-links">
    <button class="ql">Servers</button>
    <button class="ql">Telemetry</button>
    <button class="ql">Audit Log</button>
    <button class="ql">Users</button>
  </div>
  <div class="sb-right">
    <div class="sb-stat">Uptime <strong>14d 6h</strong></div>
    <div class="sb-sep">·</div>
    <div class="sb-stat">Build <strong>v2.4.1</strong></div>
    <div class="sb-sep">·</div>
    <div class="sb-stat" id="bb-time"></div>
  </div>
</div>
```

```css
.statusbar {
  display: flex;
  align-items: center;
  background: var(--s0);
  border: 1px solid var(--bd-sub);
  border-radius: var(--rc);
  overflow: hidden;
  margin-top: 3px;
  height: 38px;
}
.sb-ql-label {
  padding: 0 14px;
  height: 38px;
  display: flex;
  align-items: center;
  font: 600 8px var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--tx-mut);
  border-right: 1px solid var(--bd-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.sb-links {
  display: flex;
  align-items: center;
  padding: 0 7px;
  gap: 3px;
  flex: 1;
}
.ql {
  height: 24px;
  padding: 0 10px;
  font: 600 8px var(--font-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--bd-sub);
  color: var(--tx-mut);
  border-radius: var(--r);
  transition: color .1s, background .1s, border-color .1s;
}
.ql:hover { color: var(--tx-pri); background: var(--s2); border-color: var(--bd-hi); }
.sb-right {
  margin-left: auto;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-left: 1px solid var(--bd-sub);
  height: 38px;
  flex-shrink: 0;
}
.sb-stat {
  font: 400 8px var(--font-mono);
  color: var(--tx-mut);
  letter-spacing: .05em;
  white-space: nowrap;
}
.sb-stat strong { color: var(--tx-sec); font-weight: 500; }
.sb-sep { color: var(--bd-hi); font-size: 8px; }
```

### Scrollbar

```css
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bd-hi); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--tx-dim); }
```

---

## 6. Spacing & Density

This is an operator-facing, data-dense system. Every spacing decision favors density without sacrificing legibility. When in doubt, use less space — never more.

### Gap Reference

| Context | Gap | Rationale |
|---|---|---|
| KPI card grid | `3px` | Cards read as one unified panel |
| Chart row grid | `3px` | Consistent with KPI row rhythm |
| Node list items | `2px` | Maximum density in ranked lists |
| Incident sub-grid | `3px` | Matches card grid rhythm |
| Topbar right cluster | `7px` | Comfortable click targets |
| Section head → content | `7px` (`margin-bottom` on `.shead`) | Tight but distinct |
| Page section spacing | `16–18px` (`margin-top` on `.shead`) | Clear inter-section separation |
| Chip group | `4px` | Chips read as related |

### Card Internal Rhythm

All cards follow the same internal spacing contract. Deviating from it makes the grid feel inconsistent.

```
13px  — top padding
8px   — label-to-value gap (margin-bottom on .kpi-top)
(value — height varies by size)
10px  — value-to-chips gap (margin-bottom on .kv)
12–14px — bottom padding
Maximum 20px on any side — never exceed this.
```

### Height Reference

| Element | Height | Notes |
|---|---|---|
| Topbar | `42px` | Always fixed |
| Status bar | `38px` | Always fixed |
| Nav item | `~27px` | `padding: 7px 14px` + content |
| Topbar button | `24px` | |
| Action button (`.act`) | `26px` | |
| Quick-link button (`.ql`) | `24px` | |
| Chart container (`.cw`) | `118px` | Fixed — do not change |
| Sparkline container | `26px` | Fixed |
| Node list row (`.ni`) | `~29px` | `padding: 6px 10px` + content |
| Incident cell | `~42px` | |
| Progress track | `3px` | |
| Meter track | `2px` | |
| Status dot | `5×5px` | Always square |
| Chip dot | `4×4px` | Always square |

### Minimum Touch Target

All interactive elements must be at least `24px` tall and `24px` wide. The smallest button size (`.btn-sm`, `24px`) defines this floor. Never make a clickable element smaller.

---

## 7. Responsive Behavior

Dashboard pages respond at two breakpoints. Do not introduce page-specific breakpoints — always align with these.

### Breakpoint Rules

| Breakpoint | Change |
|---|---|
| `≤ 1200px` | KPI grid: 6-col → 3-col |
| `≤ 1200px` | Docker / 2-col grids → 1-col |
| `≤ 768px` | Sidebar collapses to icon-only or off-canvas |
| `≤ 768px` | Topbar simplifies (hide breadcrumb, collapse buttons) |
| `≤ 768px` | KPI grid: 3-col → 2-col |

### KPI Grid Responsive CSS

```css
/* Telemetry page — 6-col base */
.telemetry-page__cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
}
@media (max-width: 1200px) {
  .telemetry-page__cards { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .telemetry-page__cards { grid-template-columns: repeat(2, 1fr); }
}

/* Overview / standard pages — 5-col base */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
}
@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
}
```

### Sidebar Collapse

At `≤ 768px`, the sidebar collapses. The collapsed state shows icons only (no labels, no section headers). Navigation items use `aria-label` for accessibility. The topbar gains a hamburger menu button to toggle the sidebar back to full-width overlay.

```css
@media (max-width: 768px) {
  .sidebar {
    width: 48px;
    overflow: hidden;
  }
  .sb-section,
  .nav-a span:not(.nb),  /* hide label text */
  .sb-foot { display: none; }
  .nav-a {
    padding: 8px;
    justify-content: center;
  }
  .nav-a svg { opacity: .7; }
}
```
---

## 8. Base Components — v1

### Component Inventory

| # | Component | Base class | Variants | Sizes | States |
|---|---|---|---|---|---|
| 1 | Button | `.btn` | default · primary · solid · ghost · success · warning · danger | sm / md / lg | default · hover · active · focus · disabled |
| 2 | Input | `.input` | default · adornment | — | default · focus · error · success · disabled |
| 3 | Textarea | `.input` (textarea) | default | — | default · focus · disabled |
| 4 | Select | `.input` (select) | default | — | default · focus · disabled |
| 5 | Checkbox | `.checkbox-wrap` | default · danger | — | unchecked · checked · indeterminate · disabled |
| 6 | Radio | `.radio-wrap` | default | — | unselected · selected · disabled |
| 7 | Toggle | `.toggle-wrap` | default · success · danger | — | off · on · disabled |
| 8 | Badge | `.badge` | neutral · success · warning · danger · info · accent | sm / md / lg | static · pulse |
| 9 | Tag / Chip | `.tag` | default | — | default · hover · removable |
| 10 | Alert | `.alert` | info · success · warning · danger | — | static |
| 11 | Progress bar | `.progress-wrap` | info · success · warning · danger · indeterminate | — | static · animated |
| 12 | Stat card | `.stat-card` | default | — | static |
| 13 | Skeleton | `.skeleton` | default | — | animated shimmer |
| 14 | Divider | `.divider` | subtle · bright | — | default |

### Class Naming Convention

```
Pattern: .{component}[-{size}][-{variant}]
         .{component}.is-{state}   ← state modifier (no dash prefix)

.btn                         base class — always required
.btn .btn-md                 base + size
.btn .btn-md .btn-primary    base + size + variant
.badge .badge-sm .badge-danger
.input .is-error             base + state (NO dash, just .is-{state})
.input .is-success
```

### Button

Buttons are the primary interactive trigger. Always monospace, always uppercase.

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: .08em;
  border-radius: var(--r);
  border: 1px solid;
  cursor: pointer;
  white-space: nowrap;
  transition: background .1s ease, border-color .1s ease, color .1s ease;
}

/* Sizes */
.btn-sm { height: 24px; padding: 0 10px; font-size:  9px; }
.btn-md { height: 30px; padding: 0 14px; font-size: 10px; }
.btn-lg { height: 38px; padding: 0 18px; font-size: 11px; }

/* Icon-only (square) */
.btn-icon-only        { width: 30px; padding: 0; justify-content: center; }
.btn-sm.btn-icon-only { width: 24px; }
.btn-lg.btn-icon-only { width: 38px; }

/* Icon size within button */
.btn-icon { width: 10px; height: 10px; opacity: .7; flex-shrink: 0; }

/* Focus ring */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(58,140,255,.2);
}

/* Disabled — applies to all variants */
.btn[disabled],
.btn.is-disabled {
  opacity: 0.3;
  pointer-events: none;
  cursor: not-allowed;
}
```

| Variant class | Background | Border | Text color |
|---|---|---|---|
| `.btn-default` | `--surface-2` | `--border-bright` | `--text-primary` |
| `.btn-primary` | `--interactive-dim` | `--interactive-border` | `--interactive` |
| `.btn-solid` | `--interactive` | `--interactive` | `--text-inverse` |
| `.btn-ghost` | `transparent` | `transparent` | `--text-secondary` |
| `.btn-success` | `--success-dim` | `--success-border` | `--success` |
| `.btn-warning` | `--warning-dim` | `--warning-border` | `--warning` |
| `.btn-danger` | `--danger-dim` | `--danger-border` | `--danger` |

Hover: background lightens one surface step, border brightens. Active: background darkens one step.

**Usage examples:**
```html
<button class="btn btn-md btn-default">Export</button>
<button class="btn btn-md btn-primary">Deploy</button>
<button class="btn btn-md btn-solid">Confirm</button>
<button class="btn btn-md btn-ghost">Cancel</button>
<button class="btn btn-md btn-danger">Delete</button>
<button class="btn btn-sm btn-default" disabled>Loading</button>
<button class="btn btn-sm btn-default btn-icon-only" aria-label="Filter">
  <svg class="btn-icon">...</svg>
</button>
```

### Input

All input fields: monospace text, semantic border states for validation, never `<form>` tags.

```css
.input {
  width: 100%;
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 7px 10px;
  transition: border-color .12s ease, box-shadow .12s ease;
}
.input::placeholder { color: var(--text-muted); }

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(58,140,255,.12);
}
.input[disabled] { opacity: .35; cursor: not-allowed; }

/* Validation states */
.input.is-error              { border-color: var(--danger-border); }
.input.is-error:focus        { border-color: var(--danger); box-shadow: 0 0 0 2px var(--danger-dim); }
.input.is-success            { border-color: var(--success-border); }
.input.is-success:focus      { border-color: var(--success); box-shadow: 0 0 0 2px var(--success-dim); }
```

**Full input field with label and hint:**
```html
<div class="input-wrap">
  <label class="input-label" for="api-key">API Key</label>
  <input type="text" id="api-key" class="input is-error"
         aria-invalid="true" aria-describedby="api-key-hint"
         value="bad_value">
  <span class="input-hint is-error" id="api-key-hint">Invalid format — expected 32-char hex</span>
</div>
```

**Adornment pattern:**
```html
<div class="input-group">
  <span class="input-adornment left">https://</span>
  <input type="text" class="input" placeholder="your.domain.io">
  <span class="input-adornment right">.com</span>
</div>
```

```css
.input-wrap  { display: flex; flex-direction: column; gap: 5px; }
.input-label { font: 500 9px var(--font-mono); letter-spacing: .06em; color: var(--text-secondary); text-transform: uppercase; }
.input-hint  { font: 400 9px var(--font-mono); color: var(--text-muted); }
.input-hint.is-error   { color: var(--danger); }
.input-hint.is-success { color: var(--success); }

.input-group { display: flex; }
.input-group .input { border-radius: 0; flex: 1; }
.input-adornment {
  display: flex; align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 0 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
.input-adornment.left  { border-right: none; border-radius: var(--r-sm) 0 0 var(--r-sm); }
.input-adornment.right { border-left: none;  border-radius: 0 var(--r-sm) var(--r-sm) 0; }
```

### Toggle

CSS-only checkbox pattern — no JS required.

```html
<label class="toggle-wrap [success|danger]">
  <input type="checkbox" class="toggle-input" [checked] [disabled]>
  <span class="toggle-track">
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-label">Enable feature flag</span>
</label>
```

Track: `34×18px`. Thumb: `12×12px`, positioned `left: 2px` (off), `translateX(16px)` (on). Transition: `0.15s ease`.

Variant classes on `.toggle-wrap`:
- `.success` → on-state thumb uses `--success`, track uses `--success-dim`
- `.danger` → on-state thumb uses `--danger`, track uses `--danger-dim`

### Badge

Compact read-only status labels. Always uppercase, always mono, always uses the semantic triplet.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  border-radius: var(--r-sm);
  border: 1px solid;
  white-space: nowrap;
}
.badge-sm { font-size:  9px; letter-spacing: .09em; padding: 2px  7px; }
.badge-md { font-size: 10px; letter-spacing: .07em; padding: 3px  9px; }
.badge-lg { font-size: 11px; letter-spacing: .05em; padding: 4px 11px; }
```

| Variant | Text | Background | Border |
|---|---|---|---|
| `badge-neutral` | `--text-secondary` | `--surface-2` | `--border-bright` |
| `badge-success` | `--success` | `--success-dim` | `--success-border` |
| `badge-warning` | `--warning` | `--warning-dim` | `--warning-border` |
| `badge-danger` | `--danger` | `--danger-dim` | `--danger-border` |
| `badge-info` | `--info` | `--info-dim` | `--info-border` |
| `badge-accent` | `--accent` | `--accent-dim` | `--accent-border` |

**Pulse dot (live status):**
```html
<span class="badge badge-md badge-success">
  <span class="dot pulse"></span>Online
</span>
```
```css
.dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.dot.pulse { animation: pulse-badge 2s ease infinite; }
@keyframes pulse-badge {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60%  { box-shadow: 0 0 0 4px transparent; opacity: .6; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
}
```

**Count badge (separate element):**
```html
<span class="badge-count danger">12</span>
```
`min-width: 18px; height: 18px; font: 600 9px mono; border-radius: var(--r-sm)`. Variants: `neutral` · `danger` · `success` · `info`.

### Alert

Read-only informational panel with icon, title, and description.

```html
<!-- Icon glyphs: info=ℹ  success=✓  warning=⚠  danger=✕ -->
<div class="alert [info|success|warning|danger]">
  <span class="alert-icon">⚠</span>
  <div class="alert-body">
    <div class="alert-title">Elevated latency detected</div>
    <div class="alert-desc">Average P99 has exceeded 800ms for the past 5 minutes. Consider scaling eu-west-1a.</div>
  </div>
</div>
```

Left accent: `3px solid var(--{variant}-border)`. Icon: mono. Description: sans (multi-sentence prose).

### Progress Bar

```html
<div class="progress-wrap">
  <div class="progress-meta">
    <span>Deployment progress</span>
    <span>67%</span>
  </div>
  <div class="progress-track" role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
    <div class="progress-bar success" style="width: 67%"></div>
  </div>
</div>
```

```css
.progress-track { height: 3px; background: var(--surface-3); border-radius: 1.5px; overflow: hidden; }
.progress-bar   { height: 100%; border-radius: 1.5px; transition: width .4s ease; }

/* Indeterminate animation */
.progress-bar.indeterminate { width: 40% !important; animation: indeterminate 1.4s ease infinite; }
@keyframes indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%);  }
}
```

### Skeleton

Loading placeholder. Replaces content while data fetches. Never use a spinner — use skeleton.

```html
<!-- Text line skeleton -->
<div class="skeleton" style="height: 8px; width: 60%; border-radius: 2px;"></div>

<!-- Value skeleton -->
<div class="skeleton" style="height: 32px; width: 40%; border-radius: 2px;"></div>
```

```css
.skeleton {
  background: var(--s4);
  border-radius: var(--r);
  background-image: linear-gradient(
    90deg,
    var(--s4) 0%,
    var(--s3) 40%,
    var(--s4) 80%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 9. Extended Components — v2

### Component Inventory

| # | Component | Base class | Interactive | JS needed | Key feature |
|---|---|---|---|---|---|
| 1 | Tabs | `.tabs` | Yes | Yes | 3 layout variants |
| 2 | Accordion | `.accordion` | Yes | Yes | `max-height` animation |
| 3 | Modal | `.modal-backdrop` | Yes | Yes | 3 size variants |
| 4 | Dropdown | `.dropdown-menu` | Yes | Yes | Close on outside click |
| 5 | Command Palette | `.cmd-palette` | Yes | Yes | `⌘K` trigger |
| 6 | Data Table | `.data-table` | Yes | Optional | Row accents, sort, cell utilities |
| 7 | Breadcrumb | `.breadcrumb` | No | No | Collapsed variant |
| 8 | Pagination | `.pagination` | Yes | Optional | |
| 9 | Toast | `.toast` | Yes | Yes | Stacked, auto-dismiss |
| 10 | Stepper | `.stepper` | No | No | `::after` connector lines |
| 11 | Timeline | `.timeline` | No | No | Semantic dot colors |
| 12 | Slider | `input[type=range]` | Yes | No (CSS) | Semantic thumb variants |
| 13 | Date Picker | `.datepicker-wrap` | Yes | Yes | Custom 7-col grid calendar |
| 14 | Popover | `.popover-host` | Hover | No (CSS) | CSS-only, no JS |
| 15 | Avatar | `.avatar` | No | No | Group, status dot |
| 16 | Empty State | `.empty-state` | No | No | Icon + title + desc + CTA |
| 17 | Meter / Gauge | `.meter-wrap` | No | No | progress / meter / segmented |
| 18 | Drawer | `.drawer-backdrop` | Yes | Yes | Right-slide, spring easing |

### Tabs

Three layout variants; switching is handled by a single shared JS function.

```html
<div class="tabs tabs-underline">          <!-- or tabs-pill | tabs-bordered -->
  <div class="tab-list" role="tablist">
    <button class="tab-btn active" role="tab"
            onclick="switchTab(this,'panel-a')" aria-selected="true">
      Overview
    </button>
    <button class="tab-btn" role="tab"
            onclick="switchTab(this,'panel-b')" aria-selected="false">
      Events
      <span class="tab-badge">3</span>
    </button>
    <button class="tab-btn" role="tab"
            onclick="switchTab(this,'panel-c')" aria-selected="false">
      Config
    </button>
  </div>
  <div id="panel-a" class="tab-panel active" role="tabpanel">Panel A content</div>
  <div id="panel-b" class="tab-panel"        role="tabpanel">Panel B content</div>
  <div id="panel-c" class="tab-panel"        role="tabpanel">Panel C content</div>
</div>
```

```js
function switchTab(btn, panelId) {
  const list  = btn.closest('.tab-list');
  const tabs  = btn.closest('.tabs');
  list.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  tabs.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  document.getElementById(panelId).classList.add('active');
}
```

Active state mechanics:
- **Underline:** `border-bottom: 2px solid var(--interactive); margin-bottom: -1px` (overlaps parent border)
- **Pill:** `background: var(--surface-3); border: 1px solid var(--border-bright)`
- **Bordered:** `background: var(--surface-1); border-bottom-color: var(--surface-1)` (creates connected panel)

### Modal

```html
<div class="modal-backdrop" id="my-modal"
     role="dialog" aria-modal="true" aria-labelledby="modal-title"
     onclick="closeModalOnBg(event, this)">
  <div class="modal [modal-sm|modal-lg] [modal-danger]">
    <div class="modal-header">
      <span class="modal-title" id="modal-title">Confirm Deletion</span>
      <button class="modal-close" onclick="closeModal('my-modal')" aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <!-- Content -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost btn-md">Cancel</button>
      <button class="btn btn-danger btn-md">Delete</button>
    </div>
  </div>
</div>
```

```js
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOnBg(e, el) { if (e.target === el) el.classList.remove('open'); }
```

Sizes: `.modal-sm` = 360px · default = 480px · `.modal-lg` = 640px.
Animation: `opacity 0→1` (0.15s) + `translateY(8px) scale(.98) → 0 scale(1)` (0.18s ease).
Backdrop: `rgba(5,6,8,.8) + backdrop-filter: blur(2px)`.

**Destructive confirmation pattern** — require typed input before enabling action:
```html
<div class="modal-body">
  <p>Type <code>node-prod-01</code> to confirm permanent deletion.</p>
  <div class="input-wrap" style="margin-top:12px;">
    <label class="input-label">Confirm name</label>
    <input class="input" placeholder="node-prod-01" oninput="checkConfirm(this, 'node-prod-01', 'delete-btn')">
  </div>
</div>
<div class="modal-footer">
  <button class="btn btn-ghost btn-md">Cancel</button>
  <button class="btn btn-danger btn-md" id="delete-btn" disabled>Delete node</button>
</div>
```
```js
function checkConfirm(input, expected, btnId) {
  document.getElementById(btnId).disabled = input.value !== expected;
}
```

### Data Table

```html
<div class="data-table-wrap">
  <div class="table-toolbar">
    <input class="table-search" placeholder="Filter nodes…" aria-label="Filter table">
    <span class="table-count">12 nodes</span>
    <button class="btn btn-sm btn-default" style="margin-left:auto;">Export</button>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:36px;"><input type="checkbox" class="t-check" aria-label="Select all"></th>
        <th class="sortable sort-asc">Name <span class="sort-icon">↑</span></th>
        <th>Region</th>
        <th>Status</th>
        <th class="sortable">CPU</th>
        <th class="sortable">RAM</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Online row -->
      <tr class="row-success">
        <td><input type="checkbox" class="t-check"></td>
        <td><span class="cell-primary">node-prod-01</span></td>
        <td><span class="cell-muted">us-east-1a</span></td>
        <td><span class="t-badge success"><span class="dot pulse"></span>Online</span></td>
        <td class="cell-num">4.5%</td>
        <td class="cell-num">31%</td>
        <td><button class="btn btn-sm btn-ghost">•••</button></td>
      </tr>
      <!-- Warning row -->
      <tr class="row-warning">
        <td><input type="checkbox" class="t-check"></td>
        <td><span class="cell-primary">node-prod-07</span></td>
        <td><span class="cell-muted">eu-west-1b</span></td>
        <td><span class="t-badge warning">Degraded</span></td>
        <td class="cell-num" style="color:var(--amber);">84.1%</td>
        <td class="cell-num">67%</td>
        <td><button class="btn btn-sm btn-ghost">•••</button></td>
      </tr>
      <!-- Offline row -->
      <tr class="row-danger">
        <td><input type="checkbox" class="t-check"></td>
        <td><span class="cell-primary">node-prod-11</span></td>
        <td><span class="cell-muted">ap-south-1</span></td>
        <td><span class="t-badge danger">Offline</span></td>
        <td class="cell-num cell-muted">—</td>
        <td class="cell-num cell-muted">—</td>
        <td><button class="btn btn-sm btn-default">Restart</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

**Row accent classes:** `.row-success` · `.row-warning` · `.row-danger` — add 2px left border in semantic color.

**Cell utility classes:**
| Class | Style | Use for |
|---|---|---|
| `.cell-primary` | `--text-primary`, mono | Main identifier or name |
| `.cell-mono` | `--info`, mono | IDs, hashes, version strings |
| `.cell-muted` | `--text-muted`, 10px mono | Timestamps, regions, secondary data |
| `.cell-num` | Right-aligned, mono, `tabular-nums` | All numeric columns |
| `.cell-url` | `--info`, mono, truncate + ellipsis | Endpoint URLs |

**Table badge classes:** `.t-badge.success` · `.t-badge.warning` · `.t-badge.danger` · `.t-badge.info` · `.t-badge.neutral`

**Table cell conventions:**
| Content | Treatment |
|---|---|
| Container / service names | mono 12px, `--tx-pri` |
| Hash values, image IDs | mono 10px, `--tx-mut`, `max-width` + ellipsis |
| Endpoints / URLs | `.cell-url` — mono 11px, `--info`, truncate |
| Timestamps | mono 11px, `--tx-mut` |
| Numeric metrics (CPU, RAM) | `.cell-num` — right-aligned, mono, `tabular-nums` |
| Empty / N/A | `—` em-dash in `--tx-mut` — never `null`, `undefined`, or blank |

### Toast Notification System

```html
<!-- Toast container — place at end of body -->
<div class="toast-stack" id="toast-stack"></div>
```

```js
const toastIcons = { info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };
let toastId = 0;

function showToast(type, title, desc) {
  const stack = document.getElementById('toast-stack');
  const id = 'toast-' + (++toastId);
  // Only success and info auto-dismiss with progress bar
  const hasProgress = type === 'success' || type === 'info';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.id = id;
  t.setAttribute('role', 'alert');
  t.innerHTML = `
    <span class="toast-icon">${toastIcons[type]}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${desc}</div>
    </div>
    <button class="toast-close" onclick="removeToast('${id}')" aria-label="Dismiss">×</button>
    ${hasProgress ? `<div class="toast-progress">
      <div class="toast-progress-bar" style="animation-duration:4s;"></div>
    </div>` : ''}
  `;
  stack.appendChild(t);
  if (hasProgress) setTimeout(() => removeToast(id), 5000);
  // warning and danger require manual dismiss — no auto-remove
}

function removeToast(id) {
  const t = document.getElementById(id);
  if (!t) return;
  t.classList.add('removing');
  setTimeout(() => t.remove(), 200);
}
```

**Toast behavior rules:**
- `success` and `info` — auto-dismiss after 5000ms with animated progress bar
- `warning` and `danger` — require manual dismiss (operator must acknowledge)
- Stack position: fixed bottom-right, `24px` from edge, `gap: 8px`
- Max width: `380px`
- Entry: `opacity 0→1 + translateX(16px→0)`, `0.2s ease`
- Exit: reverse + `max-height: 0`, `0.2s ease`

### Drawer

Right-side panel overlay. Uses spring easing for a physical slide feel.

```html
<div class="drawer-backdrop" id="my-drawer"
     role="dialog" aria-modal="true"
     onclick="closeDrawerOnBg(event, this)">
  <div class="drawer">
    <div class="drawer-header">
      <span class="drawer-title">Node Details</span>
      <button class="drawer-close" onclick="closeDrawer()" aria-label="Close drawer">×</button>
    </div>
    <div class="drawer-body">
      <!-- Scrollable content -->
    </div>
    <div class="drawer-footer">
      <button class="btn btn-ghost btn-sm">Close</button>
      <button class="btn btn-primary btn-sm">Save changes</button>
    </div>
  </div>
</div>
```

```css
.drawer-backdrop { position: fixed; inset: 0; background: rgba(5,6,8,.8); backdrop-filter: blur(2px); opacity: 0; pointer-events: none; transition: opacity .15s ease; z-index: 401; }
.drawer-backdrop.open { opacity: 1; pointer-events: all; }
.drawer { position: absolute; right: 0; top: 0; bottom: 0; width: 360px; background: var(--s1); border-left: 1px solid var(--bd-def); transform: translateX(100%); transition: transform .22s cubic-bezier(.22,1,.36,1); }
.drawer-backdrop.open .drawer { transform: translateX(0); }
```

```js
function openDrawer(id)  { document.getElementById(id).classList.add('open'); }
function closeDrawer()   { document.querySelectorAll('.drawer-backdrop').forEach(d => d.classList.remove('open')); }
function closeDrawerOnBg(e, el) { if (e.target === el) el.classList.remove('open'); }
```

### Avatar

```html
<!-- Single avatar -->
<div class="avatar blue">AB</div>
<div class="avatar avatar-sm green">CD</div>
<div class="avatar avatar-lg red">EF</div>

<!-- With status indicator -->
<div class="avatar blue" style="position:relative;">
  AB
  <div class="avatar-status online"></div>    <!-- online|away|busy|offline -->
</div>

<!-- Group (stacked) -->
<div class="avatar-group">
  <div class="avatar blue">AB</div>
  <div class="avatar green">CD</div>
  <div class="avatar red">EF</div>
  <div class="avatar avatar-more">+3</div>
</div>
```

Color classes: `.blue` · `.green` · `.orange` · `.red` · `.purple`
Size classes: `.avatar-sm` (24px) · default (32px) · `.avatar-lg` (40px)

Group stack: `margin-left: -10px; border: 2px solid var(--bg)`. First child: `margin-left: 0`.

### Empty State

```html
<div class="empty-state">
  <div class="empty-icon">📭</div>
  <div class="empty-title">No results found</div>
  <div class="empty-desc">Try adjusting your filters or search terms to find what you're looking for.</div>
  <button class="btn btn-default btn-md">Clear filters</button>
</div>
```

Always use `EmptyState` / `ErrorState` React components — never create ad-hoc empty-state markup.

### Meter / Gauge

Three variants for different use cases:

```html
<!-- Standard progress bar (task completion, loading) -->
<div class="progress-wrap">
  <div class="progress-meta"><span>Deployment</span><span>67%</span></div>
  <div class="progress-track" role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
    <div class="progress-bar success" style="width:67%"></div>
  </div>
</div>

<!-- Meter (resource usage — 6px, gradient fill) -->
<div class="meter-wrap">
  <div class="meter-label"><span>CPU Usage</span><span style="color:var(--amber);">83%</span></div>
  <div class="meter-track">
    <div class="meter-fill warning" style="width:83%"></div>
  </div>
</div>

<!-- Segmented (discrete health score 0–10) -->
<div class="meter-segmented" aria-label="Health score: 7 out of 10">
  <div class="meter-seg filled success"></div>
  <div class="meter-seg filled success"></div>
  <div class="meter-seg filled success"></div>
  <div class="meter-seg filled warning"></div>
  <div class="meter-seg"></div>   <!-- empty -->
</div>
```

| Component | Track height | Fill style | Use for |
|---|---|---|---|
| `.progress-bar` | 3px | Flat color | Task completion, deployments, loading |
| `.meter-fill` | 6px | `linear-gradient` | Resource usage (CPU, RAM, disk) |
| `.meter-segmented` | 6px, individual segments | Per-segment color | Discrete health scores (0–10) |

---

## 10. Dashboard Patterns

### KPI Card Anatomy

```html
<div class="card edge eb kpi">
  <!--
    .card    — base card (position:relative, overflow:hidden, border)
    .edge    — enables ::after left-edge accent
    .eb      — blue accent (sessions/connections)
    .kpi     — internal padding: 13px 14px 14px
  -->

  <!-- TIER 1 — header row: label + optional view link -->
  <div class="kpi-top">
    <div>
      <div class="kpi-label">Sessions</div>
      <div class="kpi-sub">vs start of window</div>
    </div>
    <a href="#" class="kpi-link">View ›</a>
  </div>

  <!-- TIER 2 — primary value -->
  <div class="kv">
    11
    <!-- Optional unit suffix -->
    <span class="u">peers</span>
  </div>

  <!-- TIER 3 — supporting metadata -->
  <div class="chips">
    <span class="chip cn">→ 0.0</span>
    <span class="chip cb">
      <span class="cd live"></span>
      Live
    </span>
  </div>

</div>
```

```css
.kpi       { padding: 13px 14px 14px; }
.kpi-top   { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.kpi-label { font: 600 8px var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--tx-mut); }
.kpi-sub   { font: 400 8px var(--font-mono); letter-spacing: .04em; color: var(--tx-dim); margin-top: 1px; }
.kpi-link  { font: 400 8px var(--font-mono); letter-spacing: .06em; color: var(--blue); opacity: .6; transition: opacity .1s; white-space: nowrap; }
.kpi-link:hover { opacity: 1; }
.kv        { font: 600 32px var(--font-mono); letter-spacing: -.025em; line-height: 1; color: var(--tx-pri); margin-bottom: 10px; }
.kv .u     { font: 400 14px var(--font-mono); color: var(--tx-mut); letter-spacing: -.01em; margin-left: 2px; }
```

### Chip / Status Tag

Chips are inline status tags inside KPI cards. They are always uppercase mono, always use the semantic triplet.

```html
<span class="chip [cn|cb|cg|ca|cr]">
  <span class="cd [live]"></span>    <!-- optional dot -->
  LABEL
</span>
```

```css
.chip { display: inline-flex; align-items: center; gap: 4px; font: 500 8px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; border: 1px solid; white-space: nowrap; }
.cn   { color: var(--tx-sec);  border-color: var(--bd-hi);   background: var(--s2);      }
.cb   { color: var(--blue);    border-color: var(--blue-b);  background: var(--blue-d);  }
.cg   { color: var(--green);   border-color: var(--green-b); background: var(--green-d); }
.ca   { color: var(--amber);   border-color: var(--amber-b); background: var(--amber-d); }
.cr   { color: var(--red);     border-color: var(--red-b);   background: var(--red-d);   }
.cv   { color: var(--violet);  border-color: var(--violet-b);background: var(--violet-d);}
.cd   { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.cd.live { animation: ringpulse 2s ease infinite; }
```

### Inline Meter (inside KPI cards)

Used in the Cluster Load card to show CPU / RAM / Disk as proportional bars.

```html
<div class="cmeters">
  <div>
    <div class="cm-head">
      <span class="cm-k">CPU</span>
      <span class="cm-v" style="color:var(--green);">1.4%</span>
    </div>
    <div class="cm-track">
      <div class="cm-fill" style="width:1.4%; background:var(--green);"></div>
    </div>
  </div>
  <div>
    <div class="cm-head">
      <span class="cm-k">RAM</span>
      <span class="cm-v" style="color:var(--amber);">72%</span>
    </div>
    <div class="cm-track">
      <div class="cm-fill" style="width:72%; background:var(--amber);"></div>
    </div>
  </div>
</div>
```

```css
.cmeters  { display: flex; flex-direction: column; gap: 8px; }
.cm-head  { display: flex; justify-content: space-between; font: 400 8px var(--font-mono); letter-spacing: .05em; margin-bottom: 3px; }
.cm-k     { color: var(--tx-mut); }
.cm-v     { font-weight: 500; color: var(--tx-sec); }
.cm-track { height: 2px; background: var(--s4); border-radius: 1px; overflow: hidden; }
.cm-fill  { height: 100%; border-radius: 1px; transition: width .9s cubic-bezier(.22,1,.36,1); }
```

**Fill color thresholds:** `< 60%` → `var(--green)` · `60–85%` → `var(--amber)` · `> 85%` → `var(--red)`

Apply threshold color as inline `style` on both `.cm-v` and `.cm-fill`.

### Incident Sub-Grid

2×2 grid inside an Incidents KPI card for showing critical/warning/unhealthy counts.

```html
<div class="inc-grid">
  <div class="inc-cell">
    <div class="ic-lbl">Critical</div>
    <div class="ic-val z">0</div>     <!-- .z zero/muted, .w amber, .c red -->
  </div>
  <div class="inc-cell">
    <div class="ic-lbl">Warning</div>
    <div class="ic-val w">2</div>
  </div>
  <div class="inc-cell" style="grid-column: span 2;">
    <div class="ic-lbl">Unhealthy nodes</div>
    <div class="ic-val c">1</div>
  </div>
</div>
```

```css
.inc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-bottom: 8px; }
.inc-cell { padding: 6px 8px; background: var(--s2); border: 1px solid var(--bd-sub); border-radius: 2px; }
.ic-lbl   { font: 400 8px var(--font-mono); color: var(--tx-mut); letter-spacing: .05em; margin-bottom: 2px; }
.ic-val   { font: 600 14px var(--font-mono); color: var(--tx-sec); }
.ic-val.z { color: var(--tx-dim); }
.ic-val.w { color: var(--amber); }
.ic-val.c { color: var(--red); }
```

### Node List Item

Ranked list used in "Top Nodes by Traffic" and "Hot Nodes by CPU" chart panels.

```html
<!-- Online node -->
<div class="ni">
  <span class="nrank">1</span>
  <span class="nst ok"></span>
  <span class="nname">node-prod-01</span>
  <span class="nval">29,038 <span style="color:var(--tx-mut);font-size:8px;">Mbps</span></span>
  <div class="nbar">
    <div class="nbfill" style="width:100%; background:var(--chart-blue);"></div>
  </div>
</div>

<!-- Warning node -->
<div class="ni">
  <span class="nrank">3</span>
  <span class="nst warn"></span>
  <span class="nname">node-prod-07</span>
  <span class="nval wc">84.1%</span>
  <div class="nbar">
    <div class="nbfill" style="width:84.1%; background:var(--amber);"></div>
  </div>
</div>

<!-- Offline node -->
<div class="ni">
  <span class="nrank">5</span>
  <span class="nst off"></span>
  <span class="nname dead">node-prod-11</span>
  <span class="nval dc">offline</span>
  <div class="nbar"><div class="nbfill" style="width:0;"></div></div>
</div>
```

```css
.ni    { display: grid; grid-template-columns: 16px 7px 1fr auto 48px; align-items: center; gap: 7px; padding: 6px 10px; background: var(--s2); border: 1px solid var(--bd-sub); border-radius: 2px; transition: background .08s, border-color .08s; }
.ni:hover { background: var(--s3); border-color: var(--bd-def); }
.nrank { font: 400 8px var(--font-mono); color: var(--tx-dim); text-align: right; }
.nst   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.nst.ok   { background: var(--green); }
.nst.warn { background: var(--amber); animation: ringpulse 2s ease infinite; }
.nst.off  { background: var(--red); }
.nname    { font: 400 10px var(--font-mono); color: var(--teal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: .01em; min-width: 0; }
.nname.dead { color: var(--tx-dim); text-decoration: line-through; }
.nval  { font: 500 10px var(--font-mono); color: var(--tx-sec); white-space: nowrap; text-align: right; }
.nval.wc { color: var(--amber); }
.nval.dc { color: var(--red); }
.nbar  { height: 2px; background: var(--s4); border-radius: 1px; overflow: hidden; }
.nbfill { height: 100%; border-radius: 1px; }
```

**Bar width rule:** Rank #1 always gets `width: 100%`. All others: `width: (value / maxValue * 100)%`. Calculate in JS, apply inline.

### React Component Map

| Use case | React component | CSS class | Notes |
|---|---|---|---|
| Page title | `SectionTitle` | `.ph-title`, `type-h2` | With `MetaText` below it |
| Meta line | `MetaText` | `.ph-meta`, `type-meta` | Last-updated + counts |
| KPI number | `KpiValue` | `.kv`, `.kpi__value`, `type-data-xl` | With unit suffix |
| Status badge | `Badge` | `.badge.badge-md.badge-{variant}` | |
| Count pill | `BadgeCount` | `.badge-count.{variant}` | Numeric only |
| Tabular data | `DataTable` / `VirtualTable` | `.data-table-wrap` | Virtual for >200 rows |
| Empty view | `EmptyState` | `.empty-state` | |
| Error view | `ErrorState` | — | Variant of EmptyState |
| Form field | `Input` | `.input-wrap` | With label + hint |
| Dialog | `Modal` | `.modal-backdrop` | |
| Side panel | `Drawer` | `.drawer-backdrop` | |

**Never create bespoke card markup** when an existing primitive covers the use case. Never mix native `<table>` markup with custom styles when `DataTable` is already used on the same page.

---

## 11. Charts & Data Visualization

### Layout Grids

```css
/* KPI row — 5 cards, 3px gap */
.kpi-row   { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-bottom: 3px; }

/* Chart row — 3 area charts + 1 ranked list (fixed width) */
.chart-row { display: grid; grid-template-columns: 1fr 1fr 1fr 252px; gap: 3px; margin-bottom: 3px; }
/* Increase 252px to 280px if node names are longer than ~18 chars */
```

### SVG Area Chart

All charts use the same fixed `viewBox` and coordinate system. Do not change these constants.

```html
<div class="cw">   <!-- position: relative; height: 118px; width: 100%; -->
  <svg viewBox="0 0 300 118" preserveAspectRatio="none">

    <!-- 1. Gradient definition — unique id per chart -->
    <defs>
      <linearGradient id="pg-sessions" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#4878e8" stop-opacity=".22"/>
        <stop offset="100%" stop-color="#4878e8" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- 2. Horizontal grid lines — always exactly this stroke -->
    <line x1="22" y1="15"  x2="298" y2="15"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>
    <line x1="22" y1="45"  x2="298" y2="45"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>
    <line x1="22" y1="75"  x2="298" y2="75"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>

    <!-- 3. Y-axis labels — always this color, always text-anchor: end -->
    <text x="18" y="18"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">12</text>
    <text x="18" y="48"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">8</text>
    <text x="18" y="78"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">4</text>
    <text x="18" y="104" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">0</text>

    <!-- 4. X-axis baseline -->
    <line x1="22" y1="100" x2="298" y2="100" stroke="#182030" stroke-width="1"/>

    <!-- 5. X-axis time labels -->
    <text x="22"  y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">09:52</text>
    <text x="103" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">10:07</text>
    <text x="190" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">10:22</text>
    <text x="298" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">10:51</text>

    <!-- 6. Area fill — .cf animates opacity 0→1 at 1.1s -->
    <path d="M22 100 L75 100 L85 42 L298 42 L298 100 Z"
          fill="url(#pg-sessions)" class="cf"/>

    <!-- 7. Chart line — .cl draws in via stroke-dashoffset animation -->
    <path d="M22 100 L75 100 L85 42 L298 42"
          fill="none" stroke="#4878e8" stroke-width="1.5"
          stroke-linejoin="round" stroke-linecap="round"
          class="cl cl-1"/>

    <!-- 8. Endpoint dot — always present to mark current value -->
    <circle cx="298" cy="42" r="3"
            fill="#4878e8" stroke="#111518" stroke-width="2"/>

  </svg>
</div>
```

```css
.cw     { position: relative; width: 100%; height: 118px; }
.cw svg { position: absolute; inset: 0; width: 100%; height: 100%; }
```

**Fixed constants — never change these:**
- `viewBox`: `0 0 300 118`
- Chart content area: x `22–298`, y `10–100`
- Grid line stroke: `rgba(255,255,255,.025)` — hardcoded, not a token
- Y-label and x-label color: `#28404e` — hardcoded
- X-axis baseline color: `#182030` — hardcoded
- Endpoint dot stroke: `#111518` (matches `--s1` for cutout ring effect)
- Gradient opacity: top `0.22`, bottom `0`

**Gradient ID uniqueness:** Every chart must have a unique gradient `id`. Use descriptive suffixes: `pg-sessions`, `pg-bandwidth`, `sg-telemetry`, `sg-latency`. Duplicate IDs cause gradient cross-contamination.

### Data → SVG Coordinate Mapping

```js
/**
 * Map a data value to SVG y-coordinate.
 * SVG y increases downward, so values are inverted.
 */
function toY(value, minVal, maxVal, svgTop = 10, svgBottom = 100) {
  const pct = (value - minVal) / (maxVal - minVal);
  return svgBottom - (pct * (svgBottom - svgTop));
}

/**
 * Map a timestamp or index to SVG x-coordinate.
 */
function toX(index, totalPoints, svgLeft = 22, svgRight = 298) {
  const pct = index / (totalPoints - 1);
  return svgLeft + (pct * (svgRight - svgLeft));
}

/**
 * Build a smooth SVG path from data points.
 * Uses cubic bezier curves — never polylines.
 */
function buildPath(points) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}
```

### Sparkline (inline trend inside KPI cards)

```html
<div class="spark">
  <svg viewBox="0 0 200 26" preserveAspectRatio="none">
    <defs>
      <linearGradient id="sg-telemetry" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#32b05a" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#32b05a" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Area fill -->
    <path d="M0 22 C40 20 60 8 100 10 C140 12 160 4 200 6 L200 26 L0 26 Z"
          fill="url(#sg-telemetry)" class="cf"/>
    <!-- Line — use cubic bezier, never line segments -->
    <path d="M0 22 C40 20 60 8 100 10 C140 12 160 4 200 6"
          fill="none" stroke="var(--green)" stroke-width="1.2" class="cl cl-3"/>
  </svg>
</div>
```

```css
.spark     { width: 100%; height: 26px; margin-top: 8px; }
.spark svg { width: 100%; height: 100%; overflow: visible; }
```

Sparkline rules:
- Always use cubic bezier curves (`C` commands) — polyline `L` commands look mechanical
- `preserveAspectRatio="none"` is required — it stretches the sparkline to card width
- `stroke-width: 1.2` — thinner than full chart lines (1.5)
- Gradient opacity: `0.28` top, `0` bottom (slightly more opaque than full charts)

### Chart Color Assignment

| Data type | Hex | CSS variable | Use for |
|---|---|---|---|
| Primary metric | `#4878e8` | `--chart-blue` | Sessions, peers, active connections |
| Secondary metric | `#7858d8` | `--chart-violet` | Bandwidth, secondary chart in same panel |
| Healthy signal | `#32b05a` | `--green` | Freshness score, uptime, health rate |
| Warning signal | `#d49018` | `--amber` | Incident rate, error rate, degraded |

Always use chart colors from this table. Never pick arbitrary colors for new data series.

### Multi-Series Charts

When displaying two data series on one chart (e.g., RX + TX bandwidth):

```html
<defs>
  <linearGradient id="pg-rx" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#4878e8" stop-opacity=".22"/>
    <stop offset="100%" stop-color="#4878e8" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="pg-tx" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#7858d8" stop-opacity=".16"/>
    <stop offset="100%" stop-color="#7858d8" stop-opacity="0"/>
  </linearGradient>
</defs>

<!-- Series 1: blue (primary) -->
<path d="..." fill="url(#pg-rx)" class="cf"/>
<path d="..." fill="none" stroke="#4878e8" stroke-width="1.5" class="cl cl-1"/>

<!-- Series 2: violet (secondary) — slightly lower opacity area -->
<path d="..." fill="url(#pg-tx)" class="cf"/>
<path d="..." fill="none" stroke="#7858d8" stroke-width="1.5" class="cl cl-2"/>
```

Two series maximum per chart. More than two lines become illegible at dashboard density.
---

## 12. Motion & Animation

### Philosophy

Motion in this system serves one purpose: communicating state changes. It is never decorative. Every animation in this list has a specific semantic rationale. If your animation doesn't appear here, question whether it should exist at all.

### Keyframe Definitions

```css
/* Entrance — card/component entering the page */
@keyframes fadeup {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}

/* Live / degraded status dot ring expansion */
@keyframes ringpulse {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1;   }
  60%  { box-shadow: 0 0 0 5px transparent; opacity: .6; }
  100% { box-shadow: 0 0 0 0 transparent;  opacity: 1;   }
}

/* Chart line draw-in — requires stroke-dasharray setup in JS */
@keyframes drawline {
  to { stroke-dashoffset: 0; }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Indeterminate progress bar */
@keyframes indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

### Animation Classes

```css
/* Page entrance — applied to .card, .chart-card, .stat-card on initial paint */
.fadeup { animation: fadeup 0.4s cubic-bezier(.22,1,.36,1) both; }
/* Override delay per element position */
.delay-0 { animation-delay: 0.00s; }
.delay-1 { animation-delay: 0.04s; }
.delay-2 { animation-delay: 0.08s; }
.delay-3 { animation-delay: 0.12s; }
.delay-4 { animation-delay: 0.16s; }
.delay-5 { animation-delay: 0.20s; }

/* Chart line draw-in — .cl classes require JS to set stroke-dasharray */
.cl  { animation: drawline 1.4s ease forwards; }
/* Stagger multi-chart pages */
.cl-1 { animation-delay: 0.2s; }
.cl-2 { animation-delay: 0.4s; }
.cl-3 { animation-delay: 0.6s; }
.cl-4 { animation-delay: 0.8s; }

/* Chart fill fade-in */
.cf  { animation: fadein .9s ease forwards; opacity: 0; }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
```

**How to set up chart line draw-in (JS):**
```js
function initChartLineAnimation() {
  document.querySelectorAll('.cl').forEach(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray  = length;
    path.style.strokeDashoffset = length;
    // CSS animation handles the draw-in from here
  });
}
document.addEventListener('DOMContentLoaded', initChartLineAnimation);
```

### Transition Reference

All CSS transitions must specify only the properties that change — never `transition: all`.

| Element | Properties | Duration | Easing |
|---|---|---|---|
| Card hover | `border-color, background` | `0.15s` | `ease` |
| Node row hover | `border-color, background` | `0.08s` | `ease` |
| Nav item | `color, background` | `0.10s` | `ease` |
| Button | `background, border-color, color` | `0.10s` | `ease` |
| Input focus | `border-color, box-shadow` | `0.12s` | `ease` |
| Toggle thumb | `transform, background` | `0.15s` | `ease` |
| Accordion panel | `max-height, padding` | `0.25s` | `ease` |
| Meter / progress fill | `width` | `0.90s` | `cubic-bezier(.22,1,.36,1)` |
| Modal open | `opacity, transform` | `0.18s` | `ease` |
| Drawer open | `transform` | `0.22s` | `cubic-bezier(.22,1,.36,1)` |
| Dropdown open | `opacity, transform` | `0.12s` | `ease` |
| Popover open | `opacity, transform` | `0.12s` | `ease` |
| Skeleton shimmer | `background-position` | `1.60s` | `ease infinite` |
| Badge pulse dot | `box-shadow, opacity` | `2.00s` | `ease infinite` |
| Toast enter | `opacity, transform` | `0.20s` | `ease` |
| Toast exit | `opacity, max-height, margin` | `0.20s` | `ease` |

### Live Clock & Last-Updated Counter

```js
// Live clock — topbar
function updateClock() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}:${s} UTC`;
}
setInterval(updateClock, 1000);
updateClock();

// Last-updated counter — page head meta
let lastUpdateTime = Date.now();
function updateLastUpdated() {
  const sec = Math.floor((Date.now() - lastUpdateTime) / 1000);
  const el = document.getElementById('last-upd');
  if (!el) return;
  if (sec < 5)  { el.textContent = 'Last updated just now'; return; }
  if (sec < 60) { el.textContent = `Last updated ${sec}s ago`; return; }
  const min = Math.floor(sec / 60);
  el.textContent = `Last updated ${min}m ago`;
}
setInterval(updateLastUpdated, 5000);

// Reset counter when data refreshes
function onDataRefresh() {
  lastUpdateTime = Date.now();
  updateLastUpdated();
}
```

### Motion Rules Summary

| Situation | Correct animation | Notes |
|---|---|---|
| Component enters on page load | `fadeup` + stagger delay | `0.04s` increment per card |
| Live data streaming | `ringpulse` on status dot | Indefinite — remove on disconnect |
| Degraded / warning state | `ringpulse` on status dot | Required — static amber is ambiguous |
| Data loading | Skeleton shimmer | Never use spinner |
| Chart first render | Line draw-in (`.cl`) | Requires JS setup |
| Bar / meter first render | `width 0 → value` | `0.9s cubic-bezier(.22,1,.36,1)` |
| Value change (number) | CSS `transition: color` | Color only, not size |
| Modal opens | `opacity + translateY + scale` | `0.18s ease` |
| Drawer slides in | `translateX` | `0.22s cubic-bezier(.22,1,.36,1)` |

**Never:**
- Use `setTimeout` for visual animations — always CSS
- Use `transition: all` — always name specific properties
- Animate size/position on hover for static display components
- Add animation to mark critical/error states — static is intentional for "broken"

---

## 13. Accessibility

Every interactive component must be keyboard-navigable and screen-reader-compatible. Accessibility is not optional — it is part of the definition of done. For a full WCAG 2.0 AA checklist and implementation rules, see [WCAG 2.0 UI Compliance Guide](WCAG_2.0.md).

### WCAG 2.0 AA alignment

Success criteria we explicitly support (see WCAG_2.0.md for the full list):

- **2.4.1 Bypass Blocks** — Skip link to main content.
- **2.4.2 Page Titled** — Each route sets a meaningful `document.title`.
- **2.4.7 Focus Visible** — Keyboard focus indicated via `:focus-visible` ring.
- **3.3.2 Labels or Instructions** — Form fields have visible labels and, when invalid, `aria-invalid` and `aria-describedby`.
- **4.1.2 Name, Role, Value** — Custom UI exposes name, role, and state via ARIA and semantic HTML.

### Focus Ring

All focusable elements use a consistent 2px inset ring:

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(58,140,255,.2);
}

/* Component-specific: clear any existing box-shadow first */
.input:focus    { box-shadow: 0 0 0 2px rgba(58,140,255,.12); border-color: var(--border-focus); }
.btn:focus-visible { box-shadow: 0 0 0 2px rgba(58,140,255,.2); }
```

**Always use `:focus-visible` — never `:focus`.** `:focus` adds a ring on mouse-click; `:focus-visible` adds it only on keyboard navigation. Mouse users get no ring; keyboard users get a clear ring.

### ARIA Requirements by Component

| Component | Required ARIA | Notes |
|---|---|---|
| Modal | `role="dialog"` `aria-modal="true"` `aria-labelledby="{title-id}"` | Title element must have matching `id` |
| Modal trigger | `aria-controls="{modal-id}"` `aria-haspopup="dialog"` | |
| Tab list | `role="tablist"` on container | |
| Tab button | `role="tab"` `aria-selected="true/false"` | |
| Tab panel | `role="tabpanel"` | |
| Accordion button | `aria-expanded="true/false"` `aria-controls="{panel-id}"` | |
| Accordion panel | `id="{panel-id}"` | |
| Dropdown trigger | `aria-haspopup="listbox"` `aria-expanded="true/false"` | |
| Dropdown option | `role="option"` `aria-selected="true/false"` | |
| Data table | `<th>` with `scope="col"` | |
| Sortable column | `aria-sort="ascending/descending/none"` on `<th>` | |
| Checkbox | `aria-checked="true/false/mixed"` (indeterminate) | |
| Progress bar | `role="progressbar"` `aria-valuenow` `aria-valuemin` `aria-valuemax` | |
| Input (error) | `aria-invalid="true"` `aria-describedby="{hint-id}"` | |
| Icon-only button | `aria-label="description"` | Never use `title` attribute |
| Status dot | `aria-label="Online"` (or appropriate state) | |
| Toast | `role="alert"` or `role="status"` | `alert` for danger; `status` for info |
| Live region | `aria-live="polite"` (status) / `aria-live="assertive"` (critical) | |
| Drawer | `role="dialog"` `aria-modal="true"` | Same as modal |
| Command palette | `role="dialog"` `aria-modal="true"`; results `role="listbox"`; item `role="option"` `aria-selected` | Search input has `aria-label` |
| Meter | `role="meter"` `aria-valuemin` `aria-valuemax` `aria-valuenow` `aria-labelledby` | Accessible name required |

### Keyboard Navigation

| Component | Keyboard behavior |
|---|---|
| Button | `Enter` or `Space` activates |
| Input | Standard text entry |
| Select | `↑`/`↓` to navigate options |
| Checkbox / Toggle | `Space` toggles |
| Tabs | `←`/`→` to move between tabs; `Enter` to activate |
| Modal | `Escape` closes; focus trapped inside |
| Drawer | `Escape` closes; focus trapped inside |
| Dropdown | `↑`/`↓` to navigate; `Enter` to select; `Escape` to close |
| Command Palette | `↑`/`↓` to navigate; `Enter` to run; `Escape` to close |
| Data Table | Tab to move between cells; `Space` to select row |
| Accordion | `Enter` to toggle |

### Color Contrast

All text in this system is tested against its background token. Never override text colors in ways that reduce contrast below WCAG AA (4.5:1 for normal text, 3:1 for large text).

| Token pair | Contrast | Level |
|---|---|---|
| `--tx-pri` on `--s1` | ~9:1 | AAA |
| `--tx-sec` on `--s1` | ~4.8:1 | AA |
| `--tx-mut` on `--s1` | ~2.8:1 | Below AA — use for non-essential labels only |
| `--tx-dim` on `--s1` | ~1.8:1 | Decorative only — never for content |
| `--blue` on `--s1` | ~5.2:1 | AA |
| `--green` on `--s1` | ~5.6:1 | AA |
| `--amber` on `--s1` | ~4.7:1 | AA |
| `--red` on `--s1` | ~4.6:1 | AA |

**Rule:** `--tx-mut` and `--tx-dim` are for non-essential decorative labels (section headers, y-axis labels, chart grid labels). Never use them for content that a user needs to read to understand the page.

### Required accessibility testing

Tools: Lighthouse, axe DevTools, NVDA / VoiceOver, keyboard-only navigation. CI runs Lighthouse (accessibility category) against the built admin and fails if the score is below the configured threshold; see the repo workflow (e.g. `.github/workflows/ci.yml`).

### Design system rules

| Component  | Requirement             |
| ---------- | ----------------------- |
| Buttons    | keyboard accessible     |
| Forms      | labels + error messages |
| Navigation | logical focus order     |
| Icons      | accessible names        |
| Charts     | textual descriptions    |

### Recommended workflow

1. Design phase — check contrast and readability.
2. Development — semantic HTML + ARIA per the tables above.
3. Automated audit — Lighthouse / axe before merge.
4. Manual testing — keyboard + screen reader for critical flows.
5. CI — accessibility checks run on every PR.

---

## 14. Forms & Interactivity

### Form Structure Rules

This system has no `<form>` elements. Form patterns use `<div>` with `onClick` handlers.

```tsx
// ✓ Correct
<div className="input-wrap">
  <label className="input-label">Threshold</label>
  <input className="input" value={val} onChange={e => setVal(e.target.value)} />
  <span className="input-hint">Enter a value between 0–100</span>
  <button className="btn btn-md btn-primary" onClick={handleSubmit}>Save</button>
</div>

// ✗ Wrong — no <form> tags
<form onSubmit={handleSubmit}>
  <input type="submit" value="Save">
</form>
```

### Validation Pattern

Validation is always inline — no modal dialogs for form errors, no toast-only errors.

```tsx
interface FieldState {
  value: string;
  error: string | null;
  success: boolean;
}

function validateField(value: string): string | null {
  if (!value) return 'This field is required';
  if (value.length < 3) return 'Minimum 3 characters';
  return null; // null = valid
}

// Apply to input:
<input
  className={`input ${state.error ? 'is-error' : ''} ${state.success ? 'is-success' : ''}`}
  aria-invalid={!!state.error}
  aria-describedby={state.error ? `${fieldId}-hint` : undefined}
  value={state.value}
  onChange={e => {
    const error = validateField(e.target.value);
    setState({ value: e.target.value, error, success: !error && e.target.value.length > 0 });
  }}
/>
{state.error && (
  <span id={`${fieldId}-hint`} className="input-hint is-error">{state.error}</span>
)}
```

### Confirmation Pattern for Destructive Actions

Always require explicit user confirmation for destructive actions (delete, wipe, disable).

**Three levels of confirmation based on severity:**

1. **Low stakes** (reversible): Single button with `btn-warning` variant and a confirmation tooltip
2. **Medium stakes** (hard to undo): Modal with "Are you sure?" + Cancel + Confirm
3. **High stakes** (permanent deletion): Modal with typed confirmation (Section 9 — Modal pattern)

### Live Data Update Pattern

```tsx
import { useState, useEffect, useRef } from 'react';

function useLiveData<T>(fetchFn: () => Promise<T>, interval = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timer>();

  const refresh = async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, interval);
    return () => clearInterval(timerRef.current);
  }, []);

  return { data, lastUpdated, loading, refresh };
}
```

---

## 15. Creating New Components

This section defines the complete process for authoring a new component that integrates correctly with the Primitives system. Follow every step in order.

**Decision framework:** When facing a design decision, use the [Decision Framework](design-principles.md#13-decision-framework) in Design Principles (§13): use the system first, apply the six principles, name the state, design for the operator's next action, design failure modes, and remove non-informative elements.

### Step 1 — Classify the Component

Answer three questions before writing any code:

**1. What surface layer does it live on?**

| Layer | Token | Components |
|---|---|---|
| Page | `--bg` | Root layout only |
| Shell | `--s0` | Topbar, sidebar, status bar |
| Card / input | `--s1` | KPI cards, form fields, tables |
| Hover / elevated | `--s2` | Dropdown rows, table hover, adornments |
| Active / overlay | `--s3` | Pressed states, tooltips, modal bg |
| Track / skeleton | `--s4` | Meter fills, progress tracks, skeleton |

**2. Does it carry semantic meaning?**

If it communicates state (online/warning/error/info), it must use the full semantic triplet. If it is structurally neutral, use surface + border tokens only.

**3. Is it interactive or read-only?**

- **Interactive** (clickable, focusable): requires `:hover`, `:focus-visible`, `:active`, `:disabled`
- **Read-only** (display, badge, metric): states driven by data, no focus ring needed

### Step 2 — Name It

```
.{component}                    → base class (always required)
.{component}-{size}             → sm | md | lg
.{component}-{variant}          → semantic variant (success|warning|danger|info|accent)
.{component}.is-{state}         → runtime state (.is-error, .is-open, .is-loading)
.{component}__element           → child element (BEM double-underscore)
.{component}--modifier          → layout modifier (double-dash)
```

**Naming prohibitions:**
- No `camelCase` in class names
- No color names in class names (`.blue-card` → `.interactive-card`)
- No new abbreviations (`.btn`, `.kv`, `.kpi`, `.kw`, `.ni`, `.nb` are established; nothing new)

### Step 3 — Define the Token Contract

Fill this out before writing CSS. Every value must trace to a token — no exceptions.

```
COMPONENT: [name]
Version: v2.x
Type: [interactive | read-only | overlay | inline]
Layer: [shell | card | hover | active | track]
─────────────────────────────────────────────────
Background:       --s1
Border default:   --bd-def
Border hover:     --bd-hi
Border focus:     --bd-focus (interactive only)
Text primary:     --tx-pri
Text secondary:   --tx-sec
Text label:       --tx-mut
Semantic fill:    --{variant}-d   (if semantic)
Semantic border:  --{variant}-b   (if semantic)
Semantic text:    --{variant}     (if semantic)
Radius:           --r (2px) or --rc (3px)
Transition:       [list specific properties only]
Font:             --font-mono (all UI text)
─────────────────────────────────────────────────
No values outside this list.
```

### Step 4 — CSS Structure

Every CSS block follows this exact section order:

```css
/* ══════════════════════════════════════════════════════
   COMPONENT-NAME
   ──────────────────────────────────────────────────────
   Usage:    <div class="my-component [sm|lg] [success|warning|danger]">
   States:   default · success · warning · danger · loading · disabled
   Tokens:   --s1, --bd-def, --tx-mut, --tx-pri, --font-mono
   Children: __head · __label · __value · __unit · __meta
   Since:    v2.x
══════════════════════════════════════════════════════ */

/* 1. Base shell — layout, surface, typography, transitions */
.my-component { }

/* 2. Child elements */
.my-component__label { }
.my-component__value { }
.my-component__meta  { }

/* 3. Size modifiers */
.my-component-sm { }
.my-component-lg { }

/* 4. Semantic variant modifiers */
.my-component-success { }
.my-component-warning { }
.my-component-danger  { }
.my-component-info    { }

/* 5. Interactive states */
.my-component:hover         { }
.my-component:focus-visible { box-shadow: 0 0 0 2px rgba(58,140,255,.2); }
.my-component:active        { }
.my-component[disabled],
.my-component.is-disabled   { opacity: 0.3; pointer-events: none; cursor: not-allowed; }

/* 6. Runtime state modifiers */
.my-component.is-loading { }
.my-component.is-open    { }
.my-component.is-empty   { }
```

**One rule = one responsibility.** Never combine hover + variant + size in a single selector.

### Step 5 — Canonical HTML Structure

Define one canonical structure. Document it inline. Every instance must match exactly.

```html
<!-- MY-COMPONENT
  Required:  .my-component
  Size:      .my-component-sm | -lg
  Semantic:  .my-component-success | -warning | -danger | -info
  State:     .is-loading | .is-disabled | .is-empty
  ─────────────────────────────────────────────── -->
<div class="my-component [size] [variant] [state]">
  <div class="my-component__head">
    <span class="my-component__label">LABEL</span>
    <button class="my-component__link" onclick="...">View ›</button>  <!-- optional -->
  </div>
  <div class="my-component__value">42</div>
  <div class="my-component__meta">
    <span class="chip cn">META</span>
  </div>
</div>
```

**HTML rules:**
- No `<form>` tags — `div` + `onClick`
- No inline `style` attributes
- Semantic HTML: `<button>` for clickable, `<a>` for navigation, `<span>` for inline
- Every interactive child must be keyboard-reachable

### Step 6 — All Visual States

#### For read-only / display components

| State class | Visual treatment |
|---|---|
| base | Default surface, border, text |
| `.my-component-success` | Green triplet: `--success` + `--success-dim` + `--success-border` |
| `.my-component-warning` | Amber triplet |
| `.my-component-danger` | Red triplet + left border reinforcement |
| `.is-empty` | Metric shows `—` in `--tx-mut`; accent dims |
| `.is-loading` | Skeleton shimmer replaces content |

#### For interactive components

| State | Trigger | Treatment |
|---|---|---|
| Default | — | Base styles |
| Hover | `:hover` | Surface + 1 step, border brightens to `--bd-hi` |
| Focus | `:focus-visible` | `box-shadow: 0 0 0 2px rgba(58,140,255,.2)` |
| Active | `:active` | Surface − 1 step |
| Disabled | `[disabled]` / `.is-disabled` | `opacity: 0.3; pointer-events: none` |
| Selected | `.is-active` / `.on` | Semantic color: bg + border + text |

### Step 7 — Motion

Add animation only when it communicates state or eases a spatial transition.

| Situation | Animation | Duration |
|---|---|---|
| Component enters on page load | `fadeup` + stagger | `0.4s`, `0.04s` per index |
| Live / streaming data dot | `ringpulse` | `2s infinite` |
| Warning state dot | `ringpulse` | `2s infinite` |
| Content loading | Skeleton shimmer | `1.6s infinite` |
| Overlay appears | `opacity + translateY/scale` | `0.12–0.22s` |
| Bar first render | `width: 0 → value` | `0.9s cubic-bezier(.22,1,.36,1)` |

```css
/* Always use existing keyframes — never define new ones without review */
.my-component {
  animation: fadeup 0.4s cubic-bezier(.22,1,.36,1) both;
  animation-delay: var(--anim-delay, 0s);
}
.my-component {
  transition: border-color 0.15s ease, background 0.15s ease;
}
```

### Step 8 — React Component

```tsx
// components/MyComponent/MyComponent.tsx

type MyComponentVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type MyComponentSize    = 'sm' | 'md' | 'lg';

interface MyComponentProps {
  label:      string;
  value:      string | number;
  unit?:      string;
  meta?:      string;
  variant?:   MyComponentVariant;
  size?:      MyComponentSize;
  loading?:   boolean;
  disabled?:  boolean;
  onAction?:  () => void;
  className?: string;
}

export function MyComponent({
  label,
  value,
  unit,
  meta,
  variant   = 'default',
  size      = 'md',
  loading   = false,
  disabled  = false,
  onAction,
  className = '',
}: MyComponentProps) {
  const classes = [
    'my-component',
    size     !== 'md'      ? `my-component-${size}`    : '',
    variant  !== 'default' ? `my-component-${variant}` : '',
    loading                ? 'is-loading'               : '',
    disabled               ? 'is-disabled'              : '',
    className,
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={classes}>
        <div className="my-component__head">
          <span className="my-component__label">{label}</span>
        </div>
        <div className="skeleton" style={{ height: 32, width: '50%', borderRadius: 2, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 8,  width: '70%', borderRadius: 2, marginTop: 8 }} />
      </div>
    );
  }

  return (
    <div className={classes}>
      <div className="my-component__head">
        <span className="my-component__label">{label}</span>
        {onAction && (
          <button
            className="my-component__link"
            onClick={onAction}
            disabled={disabled}
          >
            View ›
          </button>
        )}
      </div>
      <div className="my-component__value">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="my-component__unit">{unit}</span>}
      </div>
      {meta && (
        <div className="my-component__meta">
          <span className="chip cn">{meta}</span>
        </div>
      )}
    </div>
  );
}
```

**React rules:**
- No inline `style` prop (ESLint enforces this in `admin/src/**` and `shared/src/ui/**`)
- No `<form>` elements
- No `localStorage` or `sessionStorage`
- Export named, not default
- Default values declared in destructuring, not inside the function body
- Numbers formatted with `.toLocaleString()` or a formatting utility — never raw

### Step 9 — Required Documentation Artifacts

Before merging, a new component needs all four:

**9a. CSS comment block:**
```css
/* ══════════════════════════════════════════════════════
   MY-COMPONENT
   ──────────────────────────────────────────────────────
   Usage:    <div class="my-component [sm|lg] [success|warning|danger]">
   States:   default · success · warning · danger · loading · disabled
   Tokens:   --s1, --bd-def, --tx-mut, --tx-pri, --font-mono
   Children: __head · __label · __link · __value · __unit · __meta
   Since:    v2.x
══════════════════════════════════════════════════════ */
```

**9b. Component inventory row** (in this document, Section 8 or 9):
```
| N | MyComponent | `.my-component` | success · warning · danger | sm/md/lg | default · loading · disabled |
```

**9c. Typography map entry** (`dashboard-typography-map.md`):
```
- **MyComponent value**
  React: `MyComponent`  |  CSS: `.my-component__value`  |  Role: `type-data-md` (mono, 18px, 600)
```

**9d. QA checklist item** (Section 17):
```
- [ ] MyComponent: uses class variants, not inline styles; loading state uses skeleton
```

### Step 10 — Pre-PR Self-Review

```
Token compliance
  ✓ Every color is var(--*)
  ✓ No hex values outside :root
  ✓ Surface depth matches visual layer

Typography
  ✓ All UI text uses --font-mono
  ✓ Body prose uses --font-sans
  ✓ Font sizes are from the 8-size scale

HTML structure
  ✓ Matches canonical structure documented in Step 5
  ✓ No <form> tags
  ✓ No inline style attributes

Visual states
  ✓ All states (hover, focus, active, disabled, loading) are defined
  ✓ Warning dots animate with ringpulse
  ✓ Loading state uses skeleton shimmer, not a spinner

Motion
  ✓ Entrance uses fadeup
  ✓ No JS-driven visual animations
  ✓ Transitions name only changed properties

Accessibility
  ✓ Interactive elements have :focus-visible ring
  ✓ Icon-only buttons have aria-label
  ✓ Error inputs have aria-invalid + aria-describedby
  ✓ ARIA roles applied per Section 13 table

Naming
  ✓ Base class exists and is required on every instance
  ✓ .{component}-{modifier} convention
  ✓ .is-{state} state modifiers (no dash in "is")

Lint
  ✓ pnpm lint passes with zero new warnings
```

### Worked Example: `MetricRow`

A compact horizontal row for label + value + trend, used inside detail panels.

**Token contract:**
```
Background:   transparent (inside parent card)
Border:       --bd-sub (bottom only, row separator)
Label:        --tx-mut · 8px mono · uppercase
Value:        --tx-pri · 11px mono · 600
Unit:         --tx-mut · 9px mono
Trend up:     --red   (higher = worse for infra metrics)
Trend down:   --green
Trend flat:   --tx-dim
```

**HTML:**
```html
<div class="metric-row [metric-row-success|warning|danger]">
  <span class="metric-row__label">CPU</span>
  <span class="metric-row__value">78.2<span class="metric-row__unit">%</span></span>
  <span class="metric-row__trend up">↑ 12.4%</span>
</div>
```

**CSS:**
```css
.metric-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--bd-sub);
}
.metric-row:last-child { border-bottom: none; }
.metric-row__label {
  font: 400 8px var(--font-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--tx-mut);
  flex: 1;
}
.metric-row__value { font: 600 11px var(--font-mono); color: var(--tx-pri); }
.metric-row__unit  { font: 400 9px var(--font-mono); color: var(--tx-mut); margin-left: 2px; }
.metric-row__trend { font: 500 9px var(--font-mono); letter-spacing: .04em; flex-shrink: 0; }
.metric-row__trend.up   { color: var(--red);   }
.metric-row__trend.down { color: var(--green); }
.metric-row__trend.flat { color: var(--tx-dim); }
.metric-row-success .metric-row__value { color: var(--green); }
.metric-row-warning .metric-row__value { color: var(--amber); }
.metric-row-danger  .metric-row__value { color: var(--red);   }
```

**React:**
```tsx
type MetricRowVariant = 'default' | 'success' | 'warning' | 'danger';
type TrendDir = 'up' | 'down' | 'flat';

interface MetricRowProps {
  label:     string;
  value:     string | number;
  unit?:     string;
  trend?:    string;
  trendDir?: TrendDir;
  variant?:  MetricRowVariant;
}

export function MetricRow({
  label, value, unit, trend, trendDir = 'flat', variant = 'default',
}: MetricRowProps) {
  const cls = ['metric-row', variant !== 'default' ? `metric-row-${variant}` : '']
    .filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className="metric-row__label">{label}</span>
      <span className="metric-row__value">
        {value}{unit && <span className="metric-row__unit">{unit}</span>}
      </span>
      {trend && <span className={`metric-row__trend ${trendDir}`}>{trend}</span>}
    </div>
  );
}
```

---

## 16. Anti-Patterns

These are the most common mistakes. All are treated as linting violations in code review.

### Token Violations

| Anti-pattern | Correct |
|---|---|
| `color: #3a8cff` | `color: var(--blue)` |
| `background: rgba(50,176,90,.07)` | `background: var(--green-d)` |
| `border-color: #1e272e` | `border-color: var(--bd-def)` |
| `font-family: 'Inter', sans-serif` | `font-family: var(--font-mono)` |
| `style={{ color: '#d49018' }}` (React) | `className="ca"` or `className="metric-row-warning"` |
| Overriding a token inline: `--s1: #222` | Only override tokens in `:root` or a scoped theme layer |

### Layout Violations

| Anti-pattern | Correct |
|---|---|
| `border-radius: 8px` | `border-radius: var(--r)` (2px) or `var(--rc)` (3px) |
| `border-radius: 16px` | Never — max is 6px (`--r-lg`) for large containers |
| `box-shadow: 0 4px 12px rgba(0,0,0,.3)` for elevation | Surface step + border change |
| Two `.s1` surfaces side by side with no border | Always add `border: 1px solid var(--bd-def)` between them |
| `padding: 24px` on a card | Max is 14–16px on any side |
| `gap: 12px` in KPI card grid | `gap: 3px` |

### Typography Violations

| Anti-pattern | Correct |
|---|---|
| `font-family: var(--font-sans)` on a badge | `var(--font-mono)` |
| `font-family: var(--font-sans)` on a button | `var(--font-mono)` |
| `font-size: 13px` on a label | Choose 8px, 9px, or 10px |
| `font-size: 15px` on a value | Choose 14px or 18px from the scale |
| Lowercase badge text | Always uppercase for badges, chips, labels |
| `font-weight: 400` on a KPI value | `600` |

### Color Violations

| Anti-pattern | Correct |
|---|---|
| `color: var(--green)` alone on a badge | Full triplet: color + `--green-d` bg + `--green-b` border |
| `background: rgba(50,176,90,.20)` | Max fill opacity is `8%` — use `--green-d` token |
| Static amber status dot | Must animate with `ringpulse` |
| Static green dot labeled "Live" | Must animate with `ringpulse` |
| Pulsing red dot | Remove animation — critical/offline dots are static |
| `--teal` on a button label | `--teal` is for read-only identifiers only |
| `--blue` for a non-interactive element | `--blue` is for interactive/selected only |

### State Violations

| Anti-pattern | Correct |
|---|---|
| `null` in a table cell | `—` em-dash in `--tx-mut` |
| `undefined` in a table cell | `—` em-dash in `--tx-mut` |
| Empty string in a table cell | `—` em-dash in `--tx-mut` |
| Spinner for loading | Skeleton shimmer (`shimmer` animation) |
| `transition: all` | Enumerate only changing properties |
| JS `setTimeout` for visual animation | CSS `animation` / `transition` only |

### React Violations

| Anti-pattern | Correct |
|---|---|
| `style={{ color: 'var(--red)' }}` | Add CSS class instead |
| `style={{ fontSize: '11px' }}` | Add CSS class instead |
| `<form onSubmit={...}>` | `<div>` + `onClick` handler |
| `localStorage.setItem(...)` | React state / in-memory |
| `export default MyComponent` | `export function MyComponent` (named export) |
| Ad-hoc empty state markup | Use `EmptyState` component |
| Plain `<table>` for data | Use `DataTable` component |
| KPI numbers without formatting | `.toLocaleString()` or `formatNumber()` utility |

---

## 17. QA & PR Checklist

Use this checklist for every PR that touches visual components. Check each item — a single unchecked item is grounds for requesting changes.

### Shell & Layout

```
- [ ] Topbar: height 42px, sticky, z-index: 200
- [ ] Sidebar: 192px, sticky top 42px, full-height
- [ ] Page head (.ph): title 18px mono + meta line + action buttons
- [ ] Section headers (.shead): present before every card group and table
- [ ] No hardcoded widths (other than sidebar 192px and shell columns)
- [ ] Responsive: KPI grid collapses at 1200px and 768px
```

### Typography

```
- [ ] All UI labels, buttons, badges, values: IBM Plex Mono
- [ ] Multi-sentence body copy only: IBM Plex Sans
- [ ] No Inter, Roboto, system-ui, or other fonts
- [ ] Font sizes from the 8-size scale (8/9/10/11/14/18/22/36px)
- [ ] KPI labels are uppercase with letter-spacing ≥ 0.10em
- [ ] No font-size inline styles in React components
```

### Tokens & Colors

```
- [ ] Every color value references var(--)
- [ ] No hex values in component CSS (only in :root)
- [ ] Semantic colors use the full triplet (base + dim + border)
- [ ] Semantic fill opacity ≤ 8%
- [ ] No border-radius > 3px on components (6px allowed on large containers only)
- [ ] --teal used only for read-only identifiers
- [ ] --blue used only for interactive/selected elements
```

### Components

```
- [ ] KPI values: KpiValue component or .kv + .u classes
- [ ] Status badges: Badge or .t-badge class — not plain text
- [ ] Status dots: correct color + animation rules (Section 4)
- [ ] Loading states: skeleton shimmer, not spinner
- [ ] Empty states: EmptyState component
- [ ] Data tables: DataTable component
- [ ] No ad-hoc inline status indicators (use chip/badge/tag)
```

### Layout & Cards

```
- [ ] KPI card grid: gap: 3px
- [ ] Node lists: gap: 2px
- [ ] Cards: max padding 14–16px any side
- [ ] Left-edge accent present on all KPI and chart cards
- [ ] Edge color matches card data type (Section 4 table)
- [ ] No adjacent --s1 surfaces without a border between them
```

### Motion

```
- [ ] No CSS transition: all (enumerate properties only)
- [ ] No JS setTimeout for visual animations
- [ ] Page-load entrances use fadeup with stagger
- [ ] Chart lines animate with drawline keyframe
- [ ] Meter fills animate width with cubic-bezier(.22,1,.36,1)
- [ ] Warning status dots animate with ringpulse
- [ ] Error/offline status dots are static (no animation)
```

### Accessibility

```
- [ ] Interactive elements use :focus-visible ring (not :focus)
- [ ] Icon-only buttons have aria-label
- [ ] Error inputs have aria-invalid="true" and aria-describedby
- [ ] Modals: role="dialog" aria-modal="true" aria-labelledby
- [ ] Tab components: role="tablist" / "tab" / "tabpanel" + aria-selected
- [ ] Progress bars: role="progressbar" with aria-valuenow/min/max
- [ ] Data tables: <th scope="col"> and aria-sort on sortable columns
- [ ] Toasts: role="alert" (danger) or role="status" (info/success)
- [ ] Keyboard: all interactive components reachable and operable by keyboard
```

### Code Quality

```
- [ ] No inline style props in React components
- [ ] No <form> elements
- [ ] No localStorage / sessionStorage
- [ ] All numbers formatted (toLocaleString or formatNumber utility)
- [ ] Null/undefined values displayed as — em-dash in tables
- [ ] pnpm lint passes with zero new warnings
```

---

## 18. AI Agent Quick Reference

Condensed reference for generating dashboard components from a prompt. Start here.

### Token String (paste into any component prompt)

```
Surfaces: --bg #0c0e10 | --s0 #0e1114 | --s1 #111518 | --s2 #161b1f | --s3 #1b2126 | --s4 #202830
Borders:  --bd-sub #161d22 | --bd-def #1e272e | --bd-hi #28343c | --bd-focus #3a8cff
Text:     --tx-pri #c0cdd6 | --tx-sec #6a8898 | --tx-mut #384f5e | --tx-dim #1e2c34
Semantic: --blue #3a8cff | --green #32b05a | --amber #d49018 | --red #d04040 | --violet #7850cc | --teal #2490b8
Dim fills: --blue-d rgba(58,140,255,.07) | --green-d rgba(50,176,90,.07) | --amber-d rgba(212,144,24,.07) | --red-d rgba(208,64,64,.07)
Borders:  --blue-b rgba(58,140,255,.18) | --green-b rgba(50,176,90,.18) | --amber-b rgba(212,144,24,.18) | --red-b rgba(208,64,64,.18)
Chart:    --chart-blue #4878e8 | --chart-violet #7858d8
Fonts:    --font-mono 'IBM Plex Mono' | --font-sans 'IBM Plex Sans'
Radius:   --r 2px | --rc 3px | --r-lg 6px
```

### Component Generation Template

```
Create a [COMPONENT TYPE] component with these properties:
- Surface: --s1 background, --bd-def border, --rc radius
- Typography: var(--font-mono), uppercase labels, 8px/600 labels, 32px/600 values
- Semantic: [success|warning|danger] variant using full triplet (color + -d + -b)
- Left-edge accent: .card.edge.[eb|eg|ea|er|ev|et]
- States: hover (--s2 bg + --bd-hi border), :focus-visible ring, .is-disabled opacity:0.3
- Loading: shimmer skeleton via .skeleton class
- Entrance: animation: fadeup 0.4s cubic-bezier(.22,1,.36,1) both
- No inline styles. No <form>. No hex values.
```

### Edge Color Quick Reference

```
.eb  blue    → sessions, active connections, primary interactive
.eg  green   → health, freshness, uptime, success signal
.ea  amber   → incidents, warnings, at-risk metrics
.er  red     → errors, offline nodes, critical failures
.ev  violet  → latency, secondary metrics, P99 values
.et  teal    → cluster load, infrastructure, ops metrics
```

### Type Scale Cheat Sheet

```
36px · 600 · -0.025em   hero KPI value
22px · 600 · -0.020em   chart axis value / large secondary
18px · 600 · -0.015em   page title
14px · 600 · -0.010em   sub-value / modal title
11px · 400 ·  0.000em   input / body default
10px · 400 · +0.020em   nav / node name / table cell
 9px · 400 ·  0.000em   hint / body-xs
 8px · 600 · +0.100em   UPPERCASE LABEL / badge / chip / button
```

### Z-Index Stack

```
0        Page content
10       Card elevated state
100      Dropdown menus, popovers, tooltips
200      Topbar
300      Toast notifications
400      Modal backdrop
401      Drawer backdrop
500      Command palette
700      Critical system alerts (rare)
```

### Hard Limits

| Constraint | Value |
|---|---|
| Max border-radius (component) | 2px |
| Max border-radius (card/panel) | 3px |
| Max border-radius (large container) | 6px |
| Max semantic fill opacity | 8% |
| Semantic border opacity | 18–22% |
| Min touch target | 24×24px |
| Max card padding (any side) | 14–16px |
| Topbar height | 42px |
| Sidebar width | 192px |
| Chart container height | 118px |
| Sparkline height | 26px |
| SVG viewBox | `0 0 300 118` |
| Chart content area | x: 22–298, y: 10–100 |
| Max series per chart | 2 |
| Toast max-width | 380px |
| Drawer width | 360px |
| Modal widths | 360px / 480px / 640px |
| Command palette width | 540px |
| Accordion max-height | 400px |
| Scrollbar width | 4px |

---

## 19. Glossary

| Term | Definition |
|---|---|
| **Base class** | The root class every instance of a component must carry. `.btn`, `.badge`, `.card` are examples. Size and variant classes are additive — base is always required. |
| **Canonical structure** | The one documented HTML structure for a component. Every instance must match it. Structural deviation is a bug. |
| **Dashboard alias** | Short token names (`--s1`, `--bd-def`, `--tx-pri`) used in dashboard-specific CSS. Same values as Primitives-canonical tokens. |
| **Edge accent** | The `2px` left border on KPI and chart cards, applied via `.card.edge.{color}` classes. Communicates data category at a glance. |
| **Elevation** | Visual depth expressed through surface token steps + border brightness. Never `box-shadow` for in-page depth. |
| **Primitives-canonical** | Long token names (`--surface-1`, `--border-default`, `--text-primary`) used in the primitives component library files. |
| **Semantic triplet** | The three required layers for any semantic color usage: base color (text/icon) + dim fill (background) + border opacity. Missing any layer breaks the pattern. |
| **Status dot** | A `5×5px` circular indicator. Colors: green (ok), amber (degraded), red (offline). Amber and Live dots pulse; critical/offline are static. |
| **Surface step** | Moving from one `--s*` token to the next. `--s1 → --s2` is "one step up" (for hover). Used instead of `box-shadow` for depth. |
| **Teal** | The identifier color (`--teal`). Used exclusively for read-only data like node names, service IDs, paths, hashes. Never on interactive or status elements. |
| **Three-tier card** | The required typographic hierarchy of all cards: Tier 1 = uppercase label, Tier 2 = primary value, Tier 3 = supporting chips/metadata. |
| **Token contract** | A pre-CSS inventory of every design token a new component will consume. Written before the CSS. Prevents token drift. |
| **Tinted fill** | The semantic background fill, capped at 7–8% opacity. Never used without the matching border and text color. |
| **ringpulse** | The CSS keyframe animation for live/degraded status dots. Radiates a ring outward from the dot and fades. Used for amber (degraded) and green (live) — never for red (critical). |
| **fadeup** | The page-load entrance animation. `opacity: 0 → 1` + `translateY: 6px → 0`. Always staggered across card groups. |
| **KV** | Short for Key-Value display pattern (`.kv` class). The primary 32px number in a KPI card. |
| **Chip / Tag** | Inline status label inside a card. Uses `.chip` + color class (`.cn`, `.cb`, `.cg`, `.ca`, `.cr`). Different from Badge (which is standalone). |