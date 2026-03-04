---
title: Primitives — Dashboard Implementation Guidelines
version: 2.0.0
type: guidelines
scope: dashboard-ui
audience: engineers, designers, ai-agents
reference_files:
  - dashboard-improved.html   # canonical reference implementation
  - primitives-extended.html  # component library
  - primitives-typography.html # type system
last_updated: 2026-03-03
---

# Dashboard Implementation Guidelines

> A practitioner's guide to building monitoring dashboards in the Primitives design system. Covers layout architecture, card anatomy, data display patterns, charts, and live-state conventions. All rules here are derived from `dashboard-improved.html` — the canonical reference implementation.

---

## Contents

1. [Page Architecture](#1-page-architecture)
2. [Design Tokens](#2-design-tokens)
3. [Typography Rules](#3-typography-rules)
4. [Color & Semantic System](#4-color--semantic-system)
5. [Component Anatomy](#5-component-anatomy)
6. [Charts & Data Viz](#6-charts--data-viz)
7. [Live State & Motion](#7-live-state--motion)
8. [Spacing & Density](#8-spacing--density)
9. [Anti-Patterns](#9-anti-patterns)
10. [Quick Reference](#10-quick-reference)

---

## 1. Page Architecture

### Grid Shell

Every dashboard page uses a three-zone CSS Grid: topbar spanning full width, sidebar fixed-width on the left, main content filling the rest.

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR  (42px, sticky, grid-column: 1/-1)           │
├──────────────┬───────────────────────────────────────┤
│              │  PAGE HEAD                            │
│   SIDEBAR    │  ─────────────────────────────        │
│   (192px)    │  KPI ROW  [5 × stat cards]            │
│   sticky     │  ─────────────────────────────        │
│              │  CHART ROW  [3 charts + 1 list]       │
│              │  ─────────────────────────────        │
│              │  STATUS BAR                           │
└──────────────┴───────────────────────────────────────┘
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

/* Sidebar is sticky within its grid cell */
.sidebar {
  position: sticky;
  top: 42px;
  height: calc(100vh - 42px);
  overflow-y: auto;
}
```

### Topbar

The topbar is the identity and control strip. It always contains, left to right:

1. **Wordmark** — `font: 10px/600/0.18em/uppercase`, color `--tx-sec`, separated from next element by a `1px var(--bd-sub)` right border
2. **Breadcrumb** — `font: 9px/--tx-mut`, current page in `--tx-sec`
3. **Right cluster** — live clock → live status chip → action buttons → avatar

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

**Topbar CSS:**
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
}
.tb-brand em { font-style: normal; color: var(--blue); }
.tb-right { margin-left: auto; display: flex; align-items: center; gap: 7px; }
```

### Sidebar

The sidebar provides navigation context and system health at a glance. It must always include: section labels, nav items with active state, and a footer showing version + uptime.

```html
<aside class="sidebar">
  <span class="sb-section">Monitor</span>

  <a href="#" class="nav-a on">   <!-- .on = active state -->
    <svg>...</svg>
    Overview
  </a>
  <a href="#" class="nav-a">
    <svg>...</svg>
    Incidents
    <span class="nb">1</span>   <!-- badge for count > 0 only -->
  </a>

  <span class="sb-section">Config</span>
  <a href="#" class="nav-a">...</a>

  <div class="sb-foot">
    <div class="sb-foot-row">
      <div class="dot"></div>
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
}
.sb-section {
  font: 600 8px var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--tx-dim);
  padding: 0 14px 5px;
  margin-top: 14px;
}
.nav-a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  font: 400 10px var(--font-mono);
  letter-spacing: .02em;
  color: var(--tx-mut);
  border-left: 2px solid transparent;
  transition: color .1s, background .1s;
}
.nav-a:hover { color: var(--tx-sec); background: rgba(255,255,255,.02); }
.nav-a.on {
  color: var(--blue);
  background: var(--blue-d);
  border-left-color: var(--blue);
}
.nav-a svg { width: 13px; height: 13px; opacity: .55; flex-shrink: 0; }
.nav-a.on svg { opacity: 1; }
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
.sb-foot-row .dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--green);
}
```

### Main Content

```css
.main {
  padding: 20px 18px 48px;
  overflow-y: auto;
  background: var(--bg);
}
```

The extra bottom padding (`48px`) ensures the status bar never clips at the viewport edge.

### Page Head

Sits at the top of `.main`. Contains the page title, live metadata line, and action buttons.

```html
<div class="ph">
  <div>
    <div class="ph-title">Overview</div>
    <div class="ph-meta">
      <div class="dot"></div>
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
    <button class="act hi">Refresh</button>  <!-- .hi = primary -->
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
.ph-meta .dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--green);
}
.sep { color: var(--bd-hi); }
```

### Section Headers

Visually separate logical groups of cards. Always placed before a card row.

```html
<div class="shead">
  <div class="shead-label">System Status</div>
  <div class="shead-line"></div>
  <div class="shead-note">Last 1 hour</div>  <!-- optional -->
</div>
```

```css
.shead { display: flex; align-items: center; gap: 9px; margin-bottom: 7px; }
.shead-label {
  font: 600 8px var(--font-mono);
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--tx-mut);
  white-space: nowrap;
}
.shead-line { flex: 1; height: 1px; background: var(--bd-sub); }
.shead-note { font: 400 8px var(--font-mono); letter-spacing: .05em; color: var(--tx-mut); }
```

---

## 2. Design Tokens

### Full Token Declaration

Add this `<style>` block at the top of every dashboard page. Never override individual tokens inline — change the declaration here.

```css
:root {
  /* Surfaces */
  --bg:    #0c0e10;
  --s0:    #0e1114;
  --s1:    #111518;
  --s2:    #161b1f;
  --s3:    #1b2126;
  --s4:    #202830;

  /* Borders */
  --bd-sub:   #161d22;
  --bd-def:   #1e272e;
  --bd-hi:    #28343c;
  --bd-focus: #3a8cff;

  /* Text */
  --tx-pri: #c0cdd6;
  --tx-sec: #6a8898;
  --tx-mut: #384f5e;
  --tx-dim: #1e2c34;

  /* Semantic colors — base + dim fill + border */
  --blue:     #3a8cff;
  --blue-d:   rgba(58,140,255,.07);
  --blue-b:   rgba(58,140,255,.18);

  --green:    #32b05a;
  --green-d:  rgba(50,176,90,.07);
  --green-b:  rgba(50,176,90,.18);

  --amber:    #d49018;
  --amber-d:  rgba(212,144,24,.07);
  --amber-b:  rgba(212,144,24,.18);

  --red:      #d04040;
  --red-d:    rgba(208,64,64,.07);
  --red-b:    rgba(208,64,64,.18);

  --violet:   #7850cc;
  --violet-d: rgba(120,80,204,.07);
  --violet-b: rgba(120,80,204,.18);

  --teal:     #2490b8;  /* identifiers, node names, IDs */

  /* Chart colors */
  --chart-blue:   #4878e8;
  --chart-violet: #7858d8;

  /* Typography */
  --font-mono: 'IBM Plex Mono', monospace;
  --font-sans: 'IBM Plex Sans', sans-serif;

  /* Geometry */
  --r:  2px;   /* all interactive components */
  --rc: 3px;   /* cards, panels, overlays */
}
```

### Surface Hierarchy

| Token | Hex | Use on |
|-------|-----|--------|
| `--bg` | `#0c0e10` | Page root only |
| `--s0` | `#0e1114` | Topbar, sidebar, status bar |
| `--s1` | `#111518` | All cards |
| `--s2` | `#161b1f` | Node list rows, table rows, hover states, input adornments |
| `--s3` | `#1b2126` | Active/pressed rows, tooltip backgrounds |
| `--s4` | `#202830` | Meter tracks, progress tracks, skeleton backgrounds |

**Rule:** Never place an `--s1` surface directly against another `--s1` surface without a `1px var(--bd-def)` border between them. The eye needs a separation signal.

---

## 3. Typography Rules

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

### Body Default

```css
body {
  font-family: var(--font-mono);
  font-size: 11px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--tx-pri);
  background: var(--bg);
}
```

### The Three-Tier Hierarchy

Every card must implement exactly three typographic tiers. This is the primary source of scannability.

```
TIER 1 — Label / category     8px  · 600 · 0.12em  · UPPERCASE · --tx-mut
TIER 2 — Primary value       22–36px · 600 · -0.025em · Normal  · --tx-pri
TIER 3 — Metadata / chips     8px  · 500 · 0.06em  · UPPERCASE · semantic color
```

Example implementation:
```html
<div class="kpi-label">Sessions</div>       <!-- Tier 1 -->
<div class="kv">11</div>                    <!-- Tier 2 -->
<div class="chips">                         <!-- Tier 3 -->
  <span class="chip cb">Peers: 11</span>
</div>
```

### Font Assignment by Context

| Context | Font | Notes |
|---------|------|-------|
| Buttons, badges, labels, nav | `--font-mono` | Always |
| KPI values, metric numbers | `--font-mono` | Always |
| Node names, IDs, paths | `--font-mono` | Color: `--teal` |
| Section labels | `--font-mono` | Always uppercase |
| Card title / subtitle | `--font-mono` | Subtitle: `--tx-dim` |
| Body copy, descriptions | `--font-sans` | For text > 1 sentence |
| Hint text under inputs | `--font-mono` or `--font-sans` | Short → mono; multi-line → sans |

### Size Reference

```
36px  — hero KPI value (display size)
22px  — chart value, prominent number
18px  — page title
14px  — sub-value / inc-cell value
13px  — default body text
11px  — input value, code
10px  — nav item, node name, cell value
 9px  — body-xs, hint
 8px  — label, badge, chip, meta, button  ← most UI text lives here
```

---

## 4. Color & Semantic System

### Semantic Color Rules

| Color | Signal | Correct use | Wrong use |
|-------|--------|-------------|-----------|
| `--blue` | Interactive / selected | Active nav, focus rings, primary CTA, selected state | Decoration, non-clickable elements |
| `--green` | Healthy / online / success | Status dot online, success badge, "Fresh", completed | In-progress states |
| `--amber` | Degraded / warning / risk | Pulsing status dot, elevated CPU, warning counts | Critical errors |
| `--red` | Error / offline / destructive | Offline nodes, error count, delete actions | Warnings, neutral states |
| `--violet` | Secondary metric | Chart line 2, latency card edge, secondary accents | Primary interactive elements |
| `--teal` | Identifier / read-only data | Node names, IDs, version strings, paths | Interactive, status |

### Tinted Fill Pattern

All semantic colors appear in three simultaneous layers — never use just one alone:

```css
/* ✓ All three layers together */
.my-success-element {
  color: var(--green);           /* text/icon color */
  background: var(--green-d);   /* 7% opacity fill */
  border: 1px solid var(--green-b); /* 18% opacity border */
}

/* ✗ Color alone — no context, looks broken */
.my-success-element { color: var(--green); }
```

### Left-Edge Accent (Card Accent)

Every KPI and chart card must have a 2px colored left edge. Assign color based on what that card primarily communicates.

```css
.card.edge::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--ec, var(--bd-def));
  border-radius: var(--rc) 0 0 var(--rc);
}
/* Utility classes */
.eb { --ec: var(--blue);   }
.eg { --ec: var(--green);  }
.ea { --ec: var(--amber);  }
.er { --ec: var(--red);    }
.ev { --ec: var(--violet); }
.et { --ec: var(--teal);   }
```

**Assignment guide:**

| Card content | Edge color class |
|-------------|-----------------|
| Sessions, active connections, interactive primary | `.eb` (blue) |
| Telemetry freshness, uptime, health | `.eg` (green) |
| Incidents, warnings, risk signals | `.ea` (amber) |
| Errors, offline nodes | `.er` (red) |
| Latency, secondary metrics | `.ev` (violet) |
| Cluster load, infrastructure | `.et` (teal) |

---

## 5. Component Anatomy

### Card Base

```css
.card {
  background: var(--s1);
  border: 1px solid var(--bd-def);
  border-radius: var(--rc);   /* 3px */
  position: relative;
  overflow: hidden;
  transition: border-color .15s;
}
.card:hover { border-color: var(--bd-hi); }
```

All cards: `position: relative` (required for the `::after` edge accent). All cards: `overflow: hidden` (clips edge accent to rounded corners).

### KPI Card

```html
<div class="card edge eb kpi">     <!-- card + edge + color + padding variant -->

  <!-- Header row: label left, link right -->
  <div class="kpi-top">
    <div>
      <div class="kpi-label">Sessions</div>
      <div class="kpi-sub">vs start of window</div>
    </div>
    <a href="#" class="kpi-link">View ›</a>
  </div>

  <!-- Primary value -->
  <div class="kv">11</div>

  <!-- Sub-content: chips / meters / sub-grid / sparkline -->
  <div class="chips">
    <span class="chip cn">→ 0.0</span>
    <span class="chip cb">
      <span class="cd"></span>
      Peers: 11
    </span>
  </div>

</div>
```

```css
.kpi { padding: 13px 14px 14px; }

.kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}
.kpi-label {
  font: 600 8px var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--tx-mut);
}
.kpi-sub {
  font: 400 8px var(--font-mono);
  letter-spacing: .04em;
  color: var(--tx-dim);
  margin-top: 1px;
}
.kpi-link {
  font: 400 8px var(--font-mono);
  letter-spacing: .06em;
  color: var(--blue);
  opacity: .6;
  transition: opacity .1s;
  white-space: nowrap;
}
.kpi-link:hover { opacity: 1; }

.kv {
  font: 600 32px var(--font-mono);
  letter-spacing: -.025em;
  line-height: 1;
  color: var(--tx-pri);
  margin-bottom: 10px;
}
.kv .u {   /* unit suffix like "ms" */
  font: 400 14px var(--font-mono);
  color: var(--tx-mut);
  letter-spacing: -.01em;
  margin-left: 1px;
}
```

### Chip / Tag

```html
<span class="chip cb">           <!-- .cn neutral | .cb blue | .cg green | .ca amber | .cr red -->
  <span class="cd"></span>       <!-- optional dot indicator -->
  LABEL
</span>
```

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 500 8px var(--font-mono);
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid;
  white-space: nowrap;
}
.cn { color: var(--tx-sec);  border-color: var(--bd-hi);   background: var(--s2);     }
.cb { color: var(--blue);    border-color: var(--blue-b);  background: var(--blue-d); }
.cg { color: var(--green);   border-color: var(--green-b); background: var(--green-d);}
.ca { color: var(--amber);   border-color: var(--amber-b); background: var(--amber-d);}
.cr { color: var(--red);     border-color: var(--red-b);   background: var(--red-d);  }

.cd {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
/* Live dot — add when status is active/live */
.cd.live { animation: ringpulse 2s ease infinite; }
```

### Inline Meter (for Cluster Load card)

```html
<div class="cmeters">
  <div>
    <div class="cm-head">
      <span class="cm-k">CPU</span>
      <span class="cm-v" style="color:var(--green);">1.4%</span>
    </div>
    <div class="cm-track">
      <div class="cm-fill" style="width:1.4%;background:var(--green);"></div>
    </div>
  </div>
</div>
```

```css
.cmeters { display: flex; flex-direction: column; gap: 8px; }
.cm-head {
  display: flex;
  justify-content: space-between;
  font: 400 8px var(--font-mono);
  letter-spacing: .05em;
  margin-bottom: 3px;
}
.cm-k { color: var(--tx-mut); }
.cm-v { font-weight: 500; color: var(--tx-sec); }
.cm-track {
  height: 2px;
  background: var(--s4);
  border-radius: 1px;
  overflow: hidden;
}
.cm-fill {
  height: 100%;
  border-radius: 1px;
  transition: width .9s cubic-bezier(.22,1,.36,1);
}
```

**Fill color by threshold:**
- `< 60%` → `var(--green)`
- `60–85%` → `var(--amber)`
- `> 85%` → `var(--red)`

### Incident Sub-Grid

```html
<div class="inc-grid">
  <div class="inc-cell">
    <div class="ic-lbl">Critical</div>
    <div class="ic-val z">0</div>   <!-- .z=zero .w=warn .c=crit -->
  </div>
  <div class="inc-cell">
    <div class="ic-lbl">Warning</div>
    <div class="ic-val z">0</div>
  </div>
  <div class="inc-cell" style="grid-column:span 2;">
    <div class="ic-lbl">Unhealthy nodes</div>
    <div class="ic-val w">1</div>
  </div>
</div>
```

```css
.inc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  margin-bottom: 8px;
}
.inc-cell {
  padding: 6px 8px;
  background: var(--s2);
  border: 1px solid var(--bd-sub);
  border-radius: 2px;
}
.ic-lbl { font: 400 8px var(--font-mono); color: var(--tx-mut); letter-spacing:.05em; margin-bottom: 2px; }
.ic-val { font: 600 14px var(--font-mono); color: var(--tx-sec); }
.ic-val.z { color: var(--tx-dim); }
.ic-val.w { color: var(--amber); }
.ic-val.c { color: var(--red); }
```

### Sparkline (inline trend)

Used inside KPI cards where trend context adds value (e.g., Telemetry, Latency).

```html
<div class="spark">
  <svg viewBox="0 0 200 26" preserveAspectRatio="none">
    <defs>
      <linearGradient id="spg-[id]" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#32b05a" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#32b05a" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0 18 C25 16 35 5 60 7 C85 9 95 3 120 5 C145 7 155 11 175 9 C185 8 192 7 200 8
             L200 26 L0 26 Z"
          fill="url(#spg-[id])" class="cf"/>
    <path d="M0 18 C25 16 35 5 60 7 C85 9 95 3 120 5 C145 7 155 11 175 9 C185 8 192 7 200 8"
          fill="none" stroke="var(--green)" stroke-width="1.2" class="cl cl-3"/>
  </svg>
</div>
```

```css
.spark { width: 100%; height: 26px; margin-top: 8px; }
.spark svg { width: 100%; height: 100%; overflow: visible; }
```

Rules:
- Use **cubic bezier curves** (`C` commands), never `L` line segments — sparklines must look smooth
- Always use `preserveAspectRatio="none"` so the sparkline stretches to card width
- Gradient `id` must be unique per card — use a suffix: `#spg-telemetry`, `#spg-latency`
- Gradient opacity: `0.28` top, `0` bottom
- Line `stroke-width="1.2"` — thinner than chart lines

### Node List Item

Used in "Top Nodes by Traffic" and "Hot Nodes by CPU" panels.

```html
<div class="ni">
  <span class="nrank">1</span>
  <span class="nst ok"></span>           <!-- ok | warn | off -->
  <span class="nname">node-name</span>   <!-- teal, truncates -->
  <span class="nval">29,038 <span style="color:var(--tx-mut);font-size:8px;">Mbps</span></span>
  <div class="nbar"><div class="nbfill" style="width:100%;background:var(--chart-blue);"></div></div>
</div>

<!-- Offline variant -->
<div class="ni">
  <span class="nrank">5</span>
  <span class="nst off"></span>
  <span class="nname dead">node-name</span>   <!-- .dead = strikethrough + --tx-dim -->
  <span class="nval dc">offline</span>         <!-- .dc = --red -->
  <div class="nbar"><div class="nbfill" style="width:0;"></div></div>
</div>
```

```css
.ni {
  display: grid;
  grid-template-columns: 16px 7px 1fr auto 48px;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  background: var(--s2);
  border: 1px solid var(--bd-sub);
  border-radius: 2px;
  transition: background .08s, border-color .08s;
}
.ni:hover { background: var(--s3); border-color: var(--bd-def); }
.nrank { font: 400 8px var(--font-mono); color: var(--tx-dim); text-align: right; }
.nst   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.nst.ok   { background: var(--green); }
.nst.warn { background: var(--amber); animation: ringpulse 2s ease infinite; }
.nst.off  { background: var(--red); }
.nname {
  font: 400 10px var(--font-mono);
  color: var(--teal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: .01em;
  min-width: 0;  /* required for ellipsis in flex/grid */
}
.nname.dead { color: var(--tx-dim); text-decoration: line-through; }
.nval { font: 500 10px var(--font-mono); color: var(--tx-sec); white-space: nowrap; text-align: right; }
.nval.wc { color: var(--amber); }
.nval.dc { color: var(--red); }
.nbar { height: 2px; background: var(--s4); border-radius: 1px; overflow: hidden; }
.nbfill { height: 100%; border-radius: 1px; }
```

**Bar width rule:** The #1 node always gets `width: 100%`. All others are proportional: `(value / maxValue) * 100%`. Calculate in JS or inline `style`.

### Action Buttons

Three variants for page-head actions:

```html
<button class="act">Export</button>         <!-- default -->
<button class="act">Settings</button>       <!-- default -->
<button class="act hi">Refresh</button>     <!-- primary (blue-tinted) -->
```

```css
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
.act.hi {
  background: var(--blue-d);
  border-color: var(--blue-b);
  color: var(--blue);
}
.act.hi:hover { background: rgba(58,140,255,.12); }
```

### Status Bar (Quick Links)

Fixed at the bottom of the page, spanning full main-content width.

```html
<div class="statusbar">
  <div class="sb-ql-label">Quick links</div>
  <div class="sb-links">
    <button class="ql">Servers</button>
    <button class="ql">Telemetry</button>
    <button class="ql">Audit Log</button>
  </div>
  <div class="sb-right">
    <div class="sb-stat">Uptime <strong>14d 6h 22m</strong></div>
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
}
.sb-links { display: flex; align-items: center; padding: 0 7px; gap: 3px; flex: 1; }
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
}
.sb-stat { font: 400 8px var(--font-mono); color: var(--tx-mut); letter-spacing: .05em; white-space: nowrap; }
.sb-stat strong { color: var(--tx-sec); font-weight: 500; }
.sb-sep { color: var(--bd-hi); }
```

---

## 6. Charts & Data Viz

### KPI Grid Layout

```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  margin-bottom: 3px;
}
```

### Chart Row Layout

```css
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 252px;
  gap: 3px;
  margin-bottom: 3px;
}
```

The `252px` column holds ranked node lists (fixed width for 5 items). Increase to `280px` if item names are longer.

### SVG Area Chart

**Container:**
```css
.cw {
  position: relative;
  width: 100%;
  height: 118px;
}
.cw svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

**SVG structure — copy this template for every chart:**

```html
<div class="cw">
  <svg viewBox="0 0 300 118" preserveAspectRatio="none">

    <!-- 1. Gradient definition -->
    <defs>
      <linearGradient id="[unique-id]" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="[chart-color]" stop-opacity=".22"/>
        <stop offset="100%" stop-color="[chart-color]" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- 2. Horizontal grid lines (3–4 lines) -->
    <line x1="22" y1="15"  x2="298" y2="15"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>
    <line x1="22" y1="45"  x2="298" y2="45"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>
    <line x1="22" y1="75"  x2="298" y2="75"  stroke="rgba(255,255,255,.025)" stroke-width="1"/>

    <!-- 3. Y-axis value labels -->
    <text x="18" y="18"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">12</text>
    <text x="18" y="48"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">9</text>
    <text x="18" y="78"  font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">4</text>
    <text x="18" y="104" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">0</text>

    <!-- 4. X-axis baseline -->
    <line x1="22" y1="100" x2="298" y2="100" stroke="#182030" stroke-width="1"/>

    <!-- 5. X-axis time labels -->
    <text x="22"  y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">09:52</text>
    <text x="103" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">10:07</text>
    <text x="190" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="middle">10:22</text>
    <text x="298" y="112" font-family="IBM Plex Mono" font-size="7.5" fill="#28404e" text-anchor="end">10:51</text>

    <!-- 6. Area fill — close to x-axis (y=100) -->
    <path d="M22 100 L75 100 L85 42 L298 42 L298 100 Z"
          fill="url(#[unique-id])" class="cf"/>

    <!-- 7. Line — same path without close -->
    <path d="M22 100 L75 100 L85 42 L298 42"
          fill="none" stroke="[chart-color]" stroke-width="1.5"
          stroke-linejoin="round" stroke-linecap="round"
          class="cl cl-1"/>

    <!-- 8. Endpoint dot — current value marker -->
    <circle cx="298" cy="42" r="3"
            fill="[chart-color]" stroke="#111518" stroke-width="2"/>

  </svg>
</div>
```

**Key constants:**
- `viewBox`: `0 0 300 118` — do not change
- Chart content area: x `22–298`, y `10–100` (leaves room for labels)
- Grid line stroke: `rgba(255,255,255,.025)` — always this, never a token
- Y-label color: `#28404e` — fixed, matches `--tx-dim`
- X-axis line color: `#182030` — fixed
- Endpoint dot stroke: `#111518` — matches `--s1` to create cutout ring
- Gradient top opacity: `0.22`; bottom: `0`

**Chart color by card:**

| Card | Line color | Gradient color |
|------|-----------|----------------|
| Peers / Sessions | `#4878e8` | `#4878e8` |
| Bandwidth / Secondary | `#7858d8` | `#7858d8` |
| Healthy / Fresh | `var(--green)` | `#32b05a` |
| Warning / Threshold | `var(--amber)` | `#d49018` |

### Gradient ID Uniqueness

Every gradient `id` must be unique within the page. Use a descriptive suffix:

```
id="pg-peers"     → Peers chart fill
id="pg-bandwidth" → Bandwidth chart fill  
id="sg-telemetry" → Telemetry sparkline fill
id="sg-latency"   → Latency sparkline fill
```

Duplicate IDs cause gradient cross-contamination where one chart uses another's gradient.

### Coordinate System

Map your data to SVG coordinates using this formula:

```js
// Map a value to SVG y-coordinate (inverted — SVG y increases downward)
function toY(value, minVal, maxVal, svgTop = 10, svgBottom = 100) {
  const range = maxVal - minVal;
  const pct = (value - minVal) / range;
  return svgBottom - (pct * (svgBottom - svgTop));
}

// Map a timestamp to SVG x-coordinate
function toX(timestamp, startTime, endTime, svgLeft = 22, svgRight = 298) {
  const pct = (timestamp - startTime) / (endTime - startTime);
  return svgLeft + (pct * (svgRight - svgLeft));
}
```

---

## 7. Live State & Motion

### Entrance Animation

All cards animate in on page load with staggered `fadeup`. This is the primary motion moment — it communicates data loading and draws the eye across the layout.

```css
.card, .statusbar {
  animation: fadeup .4s cubic-bezier(.22, 1, .36, 1) both;
}

/* KPI row: stagger by 40ms */
.kpi-row .card:nth-child(1) { animation-delay: .03s; }
.kpi-row .card:nth-child(2) { animation-delay: .07s; }
.kpi-row .card:nth-child(3) { animation-delay: .11s; }
.kpi-row .card:nth-child(4) { animation-delay: .15s; }
.kpi-row .card:nth-child(5) { animation-delay: .19s; }

/* Chart row: continue stagger */
.chart-row .card:nth-child(1) { animation-delay: .23s; }
.chart-row .card:nth-child(2) { animation-delay: .27s; }
.chart-row .card:nth-child(3) { animation-delay: .31s; }
.chart-row .card:nth-child(4) { animation-delay: .35s; }

/* Status bar last */
.statusbar { animation-delay: .39s; }

@keyframes fadeup {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Chart Draw Animation

Applied as CSS classes to SVG elements:

```css
/* Line draw — applied to chart line <path> */
.cl {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: draw 1.5s ease forwards;
}
.cl-1 { animation-delay: .55s; }
.cl-2 { animation-delay: .62s; }
.cl-3 { animation-delay: .50s; }   /* sparklines can start earlier */
.cl-4 { animation-delay: .58s; }

@keyframes draw { to { stroke-dashoffset: 0; } }

/* Fill fade — applied to area fill <path> */
.cf {
  opacity: 0;
  animation: fin .5s ease forwards;
  animation-delay: 1.1s;   /* fade in AFTER line has mostly drawn */
}
@keyframes fin { to { opacity: 1; } }
```

**Rule:** Each chart's line class (`cl-1`, `cl-2`, etc.) must have a unique delay so all charts don't draw simultaneously. The fill always delays `1.1s` from page load — this creates the effect of the area appearing after the line defines it.

### Live Status Pulse

```css
@keyframes ringpulse {
  0%   { box-shadow: 0 0 0 0 currentColor; }
  65%  { box-shadow: 0 0 0 5px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

Apply to:
- Live chip dot in topbar (`.live-chip .ring`)
- Pulsing green dot in page meta line
- Warning status dots (`.nst.warn`) — always pulse
- Active/live badge dots when data is streaming

**Do not apply to:** `.ok` status dots (static green), `.off` dots (static red), decorative dots.

### Transition Reference

```css
/* Card hover */
.card { transition: border-color .15s ease; }

/* Node row hover */
.ni   { transition: background .08s ease, border-color .08s ease; }

/* Nav item */
.nav-a { transition: color .1s ease, background .1s ease; }

/* Button */
.act, .tb-btn, .ql { transition: color .1s ease, border-color .1s ease, background .1s ease; }

/* View link */
.kpi-link { transition: opacity .1s ease; }

/* Meter fill (animate on data load) */
.cm-fill { transition: width .9s cubic-bezier(.22,1,.36,1); }
```

### Live Clock

```js
function tick() {
  const t = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const clock = document.getElementById('clock');
  const bbTime = document.getElementById('bb-time');
  if (clock)  clock.textContent  = t;
  if (bbTime) bbTime.textContent = t;
}
tick();
setInterval(tick, 1000);
```

### Last Updated Counter

```js
let elapsed = 0;
const lastUpd = document.getElementById('last-upd');
setInterval(() => {
  elapsed++;
  if (!lastUpd) return;
  lastUpd.textContent = elapsed < 60
    ? `Last updated ${elapsed}s ago`
    : `Last updated ${Math.floor(elapsed / 60)}m ago`;
}, 1000);
```

Both must be present on every live dashboard page.

---

## 8. Spacing & Density

This system is operator-facing and data-dense. Every spacing decision favors density.

### Gap Rules

| Context | Gap | Why |
|---------|-----|-----|
| KPI card grid | `3px` | Cards feel like one unified panel |
| Chart row grid | `3px` | Consistent with KPI row above |
| Node list items | `2px` | Maximum density in lists |
| Incident sub-grid | `3px` | Matches card grid rhythm |
| Topbar elements | `7–8px` | Comfortable click targets |
| Section head → cards | `7px margin-bottom` on `.shead` | Tight but distinct |
| KPI row → section head | `16–18px margin-top` | Clear section separation |

### Card Internal Rhythm

```
13px  — top padding
8px   — header bottom margin
Value (variable height)
10px  — chips/sub-content top margin
10–14px — bottom padding
```

Never exceed `20px` internal padding on any side of a card.

### Height Reference

| Element | Height |
|---------|--------|
| Topbar | `42px` |
| Nav item | ~`27px` (7px top/bottom + content) |
| Topbar buttons | `24px` |
| Act buttons | `26px` |
| Quick-link buttons | `24px` |
| Status bar | `38px` |
| Node row | ~`29px` (6px top/bottom + content) |
| Incident cell | ~`42px` |
| Chart container | `118px` |
| Sparkline container | `26px` |
| Meter track | `2px` |
| Status dot | `5px` |
| Chip dot | `4px` |

---

## 9. Anti-Patterns

### Hardcoded Values

```css
/* ✗ Never */
color: #3a8cff;
background: #111518;
border: 1px solid #28343c;
font-family: 'IBM Plex Mono', monospace;

/* ✓ Always */
color: var(--blue);
background: var(--s1);
border: 1px solid var(--bd-hi);
font-family: var(--font-mono);
```

### Charts Without Area Fill

```html
<!-- ✗ Bare line — no area, no gradient -->
<path d="M22 42 L298 42" stroke="#4878e8" stroke-width="1.5"/>

<!-- ✓ Area + line + endpoint -->
<path d="M22 100 L85 42 L298 42 L298 100 Z" fill="url(#pg)" class="cf"/>
<path d="M22 100 L85 42 L298 42" stroke="#4878e8" stroke-width="1.5" class="cl cl-1"/>
<circle cx="298" cy="42" r="3" fill="#4878e8" stroke="#111518" stroke-width="2"/>
```

### Unformatted Numbers

```html
<!-- ✗ Raw value — unreadable -->
<span>29038.5</span>
<span>1.43561318274880887</span>

<!-- ✓ Formatted -->
<span>29,038</span>
<span>1.44%</span>
```

### Missing Left-Edge Accent

```html
<!-- ✗ Card without edge — visually flat, no semantic signal -->
<div class="card kpi">...</div>

<!-- ✓ Card with semantic edge color -->
<div class="card edge eb kpi">...</div>
```

### Truncated Identifiers Without CSS

```css
/* ✗ JS substring — loses data, no recovery on resize */
node.textContent = name.substring(0, 20) + '...';

/* ✓ CSS ellipsis — responsive, hover-recoverable */
.nname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;  /* required inside grid/flex! */
}
```

### Warning Dots Without Pulse

```css
/* ✗ Static warning dot — looks dead, not degraded */
.nst.warn { background: var(--amber); }

/* ✓ Pulsing — communicates active degraded state */
.nst.warn { background: var(--amber); animation: ringpulse 2s ease infinite; }
```

### Same Surface Level Without Border

```html
<!-- ✗ Two --s1 cards touching with no border separation -->
<div class="card" style="background:var(--s1);">...</div>
<div class="card" style="background:var(--s1);">...</div>

<!-- ✓ Cards separated by card borders + 3px gap -->
<div class="card" style="border:1px solid var(--bd-def);">...</div>
<!-- 3px gap -->
<div class="card" style="border:1px solid var(--bd-def);">...</div>
```

### Wrong Font for Data

```css
/* ✗ Sans-serif for a numeric KPI value */
.kpi-value { font-family: var(--font-sans); }

/* ✓ Mono for all data, values, IDs */
.kv, .nval, .nname, .ic-val { font-family: var(--font-mono); }
```

---

## 10. Quick Reference

### Token Paste Block

For AI agent context or quick lookup:

```
bg=#0c0e10 s0=#0e1114 s1=#111518 s2=#161b1f s3=#1b2126 s4=#202830
bd-sub=#161d22 bd-def=#1e272e bd-hi=#28343c bd-focus=#3a8cff
tx-pri=#c0cdd6 tx-sec=#6a8898 tx-mut=#384f5e tx-dim=#1e2c34
blue=#3a8cff green=#32b05a amber=#d49018 red=#d04040
violet=#7850cc teal=#2490b8 chart-blue=#4878e8 chart-violet=#7858d8
font-mono='IBM Plex Mono' font-sans='IBM Plex Sans'
r=2px rc=3px gap=3px topbar=42px sidebar=192px
```

### Edge Color Assignment

| Card content | Class |
|-------------|-------|
| Sessions, connections, active | `.eb` |
| Health, freshness, uptime | `.eg` |
| Incidents, risk, warnings | `.ea` |
| Errors, offline | `.er` |
| Latency, secondary metrics | `.ev` |
| Infrastructure, cluster | `.et` |

### Chart Color Assignment

| Data type | Line/gradient color |
|-----------|-------------------|
| Primary metric (sessions, peers) | `#4878e8` |
| Secondary metric (bandwidth, latency) | `#7858d8` |
| Healthy/fresh signal | `#32b05a` |
| Degraded/warning signal | `#d49018` |

### Status Dot Rules

| State | Color | Animation |
|-------|-------|-----------|
| Online / ok | `--green` | None — static |
| Degraded / warning | `--amber` | `ringpulse` always |
| Offline / error | `--red` | None — static |
| Live / streaming | `--green` | `ringpulse` always |

### Typography Cheat Sheet

```
Page title      → 18px / 600 / -.015em / mono / --tx-pri
KPI big value   → 32px / 600 / -.025em / mono / --tx-pri  
Chart value     → 21px / 600 / -.020em / mono / --tx-pri
Card label      → 8px  / 600 / .120em  / mono / --tx-mut / UPPERCASE
Section label   → 8px  / 600 / .150em  / mono / --tx-mut / UPPERCASE
Button / badge  → 8px  / 600 / .100em  / mono / semantic / UPPERCASE
Nav item        → 10px / 400 / .020em  / mono / --tx-mut
Node name       → 10px / 400 / .010em  / mono / --teal
Metadata        → 8px  / 400 / .050em  / mono / --tx-mut
Body copy       → 11–13px / 400 / 0    / sans / --tx-sec
```

### Grid Quick Reference

```
Shell:      grid-template-columns: 192px 1fr
            grid-template-rows: 42px 1fr

KPI row:    grid-template-columns: repeat(5, 1fr);  gap: 3px
Chart row:  grid-template-columns: 1fr 1fr 1fr 252px;  gap: 3px

Incident:   grid-template-columns: 1fr 1fr;  gap: 3px
Node item:  grid-template-columns: 16px 7px 1fr auto 48px;  gap: 7px
```