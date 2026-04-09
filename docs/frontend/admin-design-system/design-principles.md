# Primitives — UI Design Handbook
**Design Code · Application Guidelines · Component Usage**

> This handbook is the practitioner's guide to the Primitives design system. Where the system specification answers "what are the rules?", this handbook answers "how do I apply them?" Read it when designing a new page, choosing a component, deciding whether to build something new, or trying to understand why the system works the way it does.

---

## Contents

### Part I — Design Code
1. [Who This Interface Is For](#1-who-this-interface-is-for)
2. [The Six Core Principles](#2-the-six-core-principles)
3. [Visual Language & Aesthetic Contract](#3-visual-language--aesthetic-contract)
4. [Using the Design Token System](#4-using-the-design-token-system)
5. [Typography in Practice](#5-typography-in-practice)
6. [Color in Practice](#6-color-in-practice)

### Part II — Layout & Page Design
7. [Page Architecture](#7-page-architecture)
8. [Navigation Design](#8-navigation-design)
9. [Grid & Spacing](#9-grid--spacing)
10. [Hierarchy & Information Order](#10-hierarchy--information-order)
11. [Density & Scannability](#11-density--scannability)
12. [Responsive Behavior](#12-responsive-behavior)

### Part III — Component Usage
13. [Component Selection Guide](#13-component-selection-guide)
14. [Using Primitives (Base Components)](#14-using-primitives-base-components)
15. [Extended Components in Context](#15-extended-components-in-context)
16. [Dashboard Patterns](#16-dashboard-patterns)
17. [Tables](#17-tables)
18. [Charts & Data Visualization](#18-charts--data-visualization)
19. [Forms & Inputs](#19-forms--inputs)
20. [Feedback & Notifications](#20-feedback--notifications)

### Part IV — Building New Components
21. [When to Create a New Component](#21-when-to-create-a-new-component)
22. [How to Design a New Component](#22-how-to-design-a-new-component)
23. [Composing with Primitives](#23-composing-with-primitives)
24. [Design Patterns & Recipes](#24-design-patterns--recipes)

### Part V — Quality & Governance
25. [Interaction Design](#25-interaction-design)
26. [Motion & Animation](#26-motion--animation)
27. [Accessibility Practice](#27-accessibility-practice)
28. [Decision Framework](#28-decision-framework)
29. [Quality Standards](#29-quality-standards)

---

## Part I — Design Code

---

## 1. Who This Interface Is For

Every design decision flows from a clear picture of the person using this product. Before touching a layout or choosing a component, hold this person in mind.

### The Primary User

An infrastructure engineer or platform operator. Their daily work involves monitoring live systems, responding to alerts, investigating degraded services, and making operational decisions under time pressure. They may be:

- Scanning the dashboard at the start of a shift to assess system health
- Responding to an alert at 2am, under pressure, in a dark environment
- Drilling through a table of 200 nodes looking for the one that's causing elevated P99
- Running a deployment and watching metrics react in real time

**They are not exploring.** They are interrogating. The dashboard is a professional tool, not a product to be admired.

### What They Need From the Interface

**Speed of comprehension.** The most important value on screen should be readable in under one second without prior navigation. Status should be visible without clicking. Context should support the value without competing with it.

**Trust.** When they look at a number, they need to know it's current. When they see green, it must mean healthy. When they see amber, it must mean something needs attention. An interface that uses color inconsistently trains distrust.

**Minimal cognitive load.** Every pixel that is not carrying information is consuming attention that could go toward solving an operational problem. The operator is already under cognitive load from the system they're monitoring. The dashboard should not add to it.

**Operability under stress.** Destructive actions must require deliberate confirmation. Critical information must not auto-dismiss. The interface must not assume the operator is at full attention.

### What This Interface Refuses to Be

Understanding the user means also understanding misuse. This system is not:

- A showcase for visual craft — aesthetic choices that don't serve legibility are wrong here
- An onboarding experience — discovery and exploration are not the operating mode
- A consumer product — emotional warmth, friendly illustrations, and rounded corners serve a different audience
- A marketing surface — nothing exists here to create an impression; everything exists to convey operational state

When you feel the pull toward something "nicer" — rounder corners, a gradient, more whitespace — ask whether it serves the person at 2am. Usually it doesn't.

---

## 2. The Six Core Principles

These six principles sit above everything else. When two guidelines conflict, these resolve the conflict. Memorize them.

### 1 · Legibility Over Aesthetics

The most important thing a piece of information can do is be read quickly and correctly. A dashboard that looks stunning but takes two seconds to parse is inferior to a plain one that parses in half a second.

**Applied:** tight density over spaciousness, high-contrast text hierarchy, monospace type for data alignment, restrained semantic color, no gradients or textures.

**Test:** Can an operator glance at this element for one second and correctly understand its state?

### 2 · Meaning Before Appearance

Ask "what does this communicate?" before asking "what does this look like?" Color, size, weight, and animation are outputs of meaning, not inputs to it. Name the state first. Let the token system deliver the correct visual.

**Applied:** Component variants named by state (`badge-success`), not color (`badge-green`). Color chosen by semantic mapping, not visual preference.

**Test:** If the color were stripped away, would the element still communicate its state through shape, label, and structure?

### 3 · State Is Always Visible

The interface must reflect the current state of the system at all times. State must be visible without interaction — the operator should not have to hover or click to discover that a service is degraded.

**Applied:** Status dots on every node row. Semantic chip colors on every KPI card. Pulsing animation on live and degraded states. Loading skeletons rather than blank spaces.

**Test:** Cover every interactive element. Can the state of every piece of data still be read?

### 4 · Actions Are Unambiguous

Every interactive element must look exactly as interactive as it is — no more, no less. Interactive elements must look different from read-only elements at rest, not just on hover.

**Applied:** Buttons have borders and backgrounds. Clickable identifiers use `--teal`. Disabled states reduce to 30% opacity with `pointer-events: none`. Destructive actions use the danger color variant.

**Test:** Can a new user identify every clickable element on the page without hovering?

### 5 · Consistency Is a Feature

Every instance of a pattern must look and behave identically. Inconsistency taxes the operator's attention — their brain checks whether a visual difference is meaningful. It almost never is, but the check still happens.

**Applied:** Token system enforces color consistency. Component system enforces structural consistency. Section headers always look the same. KPI cards always use the three-tier structure.

**Test:** Take any two instances of the same component on the page. Are they pixel-identical in their base state?

### 6 · Restraint Is Correctness

If you're not sure a visual element should be there, it shouldn't. Every element on screen competes for the operator's limited attention. Elements that aren't actively communicating information are consuming attention budget.

**Applied:** No decorative separators. No animations that don't signal state change. No color for visual balance. No padding "to give things room to breathe" without a legibility rationale.

**Test:** Point to each element and name what information it carries. If you can't name it, remove it.

---

## 3. Visual Language & Aesthetic Contract

The Primitives aesthetic is called **industrial-minimal**. Understanding what that means — and what it explicitly rejects — is the foundation for making consistent design decisions.

### Three Reference Points

**Terminal interfaces.** The aesthetic lineage comes from command-line UIs: dark backgrounds, monospace type, high density, minimal decoration. Not as nostalgia — as function. These constraints were arrived at by people who needed to read technical information for hours at a time.

**Technical instruments.** Flight instruments, control panels, and industrial monitoring displays share a design logic: precise values legible at a glance, operational states communicated unambiguously, space used economically. No hero sections. No whitespace as premium signal.

**Data journalism typography.** The three-tier card hierarchy borrows from print data design: one story per unit, structured scanability, the relationship between label, value, and supporting context.

### The Aesthetic Contract

These are the immutable choices that define the visual identity. They are not up for revision on a per-page basis.

**Dark-first.** All surfaces are calibrated for dark backgrounds. There is no light mode. Surface hierarchy runs from `--bg` (darkest) through `--s4` (least dark) — four useful stops in a narrow range. The system is only valid in this range.

**Flat depth.** Elevation is communicated through surface-color steps and border-brightness changes. No `box-shadow` for in-page depth. The exception is overlays (modals, drawers, command palette) which use a single strong shadow to establish they float above the page plane.

**Sharp geometry.** Border radius is either 2px (interactive components) or 3px (cards and panels). Maximum 6px for large containers. No 8px, 12px, 16px, or rounded-full corners. Sharp corners communicate precision; excessive rounding communicates softness and friendliness — the wrong register for an ops tool.

**Monospace-forward.** IBM Plex Mono for all UI chrome. IBM Plex Sans for multi-sentence body copy only. No other typefaces under any circumstances.

**Borders as information.** Borders are not purely decorative. They separate surfaces of the same level, signal hover elevation, and carry semantic color in active states. Every border in the system means something.

**No decoration.** No background gradients. No textures. No illustrations. No icons used purely for visual interest. No colored backgrounds for visual balance (only for semantic signal).

### What the System Refuses

These are hard constraints, not style preferences:

- No light surfaces behind content (all surfaces use `--bg` through `--s4`)
- No `border-radius > 6px` anywhere
- No `box-shadow` for elevation within the page
- No font other than IBM Plex Mono and IBM Plex Sans
- No color that isn't a system token
- No decoration that doesn't carry information

---

## 4. Using the Design Token System

Tokens are the mechanism that makes the system consistent, refactorable, and AI-generatable. Understanding how to use them is foundational — before touching any component or layout.

### What a Token Is

A token is a named CSS custom property that represents a design decision. `--bd-def` is not "the color #1e272e" — it is "the default border color for components." The distinction matters: if you reference `--bd-def`, your component inherits the system's intention about default borders. If you hardcode `#1e272e`, your component is an island.

### The Token Hierarchy

The system has five token categories, in ascending specificity:

```
1. Surfaces    --bg, --s0 through --s4
2. Borders     --bd-sub, --bd-def, --bd-hi, --bd-focus
3. Text        --tx-pri, --tx-sec, --tx-mut, --tx-dim
4. Semantic    --blue, --green, --amber, --red, --violet, --teal
               + each: --{color}-d (fill) and --{color}-b (border)
5. Component   --font-mono, --font-sans, --r, --rc, --r-lg, --sp-*
```

Use tokens at the lowest level that matches your intent. If you're setting a card background, use `--s1` (the surface token for cards) — not `--surface-1` if you're in dashboard code — and never a hardcoded hex.

### Dual Naming System

Two parallel naming sets exist: short dashboard aliases (`--s1`, `--bd-def`, `--tx-pri`, `--blue`) and Primitives-canonical long names (`--surface-1`, `--border-default`, `--text-primary`, `--interactive`). They map to the same values. Use whichever set is established in the file you're editing. Never mix them within a single component's CSS.

### Token Usage Rules

**Use the most semantically correct token, not the most visually convenient one.** If your component is a card, use `--s1`. Don't use `--s2` because it looks a bit better at a specific screen resolution. `--s2` means "hover/elevated" — using it for a resting card lies about the elevation hierarchy.

**Never derive values from tokens.** `calc(var(--sp-2) + 2px)` is a sign that the right token doesn't exist yet, or that you're solving the wrong problem. Request a new token if needed — don't compute pseudo-tokens.

**Never override tokens inline.** Don't write `style="--s1: #222"` to tweak one component. If a surface needs to be different, it's a different component or a genuine token revision.

**Semantic colors always travel in triplets.** Using `var(--green)` without `var(--green-d)` and `var(--green-b)` is an incomplete use of the token system. The triplet exists because color alone is visually disconnected on dark surfaces. See Section 6 for the full pattern.

### How to Read a Token Name

```
--bd-def
  bd = border category
  def = default level (sub → def → hi → focus)

--tx-mut
  tx = text category
  mut = muted level (pri → sec → mut → dim)

--green-d
  green = semantic color
  d = dim fill (8% opacity variant)

--green-b
  green = semantic color
  b = border (18-22% opacity variant)
```

---

## 5. Typography in Practice

### The One Rule That Overrides Everything

**Monospace for UI. Sans for prose.** If it's a label, value, number, identifier, status, button, badge, chip, nav item, section header, or table cell — use `--font-mono`. If it's a sentence or longer — use `--font-sans`. When uncertain: mono.

### Applying the Type Scale

The type scale has 8 sizes. Every text element maps to one of them. Here's how to choose:

| Content | Size | Weight | Tracking | Case |
|---|---|---|---|---|
| Hero KPI value (largest on page) | 36px | 600 | -0.025em | Mixed |
| Chart value, secondary hero | 22px | 600 | -0.020em | Mixed |
| Page title | 18px | 600 | -0.015em | Mixed |
| Sub-value, modal title, section heading | 14px | 600 | -0.010em | Mixed |
| Input value, body default, code | 11px | 400 | 0 | Mixed |
| Nav items, table cells, node names | 10px | 400 | +0.020em | Mixed |
| Hint text, body-xs, timestamps | 9px | 400 | 0 | Mixed |
| Labels, badges, chips, buttons | 8px | 500–600 | +0.100em | **UPPERCASE** |

**WCAG 2.0 AA note:** These pixel values describe the internal type token scale. For production UIs targeting WCAG 2.0 AA, never render text smaller than **12px**; any role that uses 8–11px tokens must be scaled so its effective on-screen size is ≥ 12px.

**The question for every text element is:** What tier does this sit on, and what is its role in the hierarchy?

- Is it naming something? → 8px uppercase label
- Is it the primary value being named? → 22–36px bold value
- Is it context for the value? → 8px chip or metadata
- Is it navigating somewhere? → 10px nav item
- Is it explaining something in prose? → 9–11px sans

### When to Use Each Weight

**400 (regular):** Body copy, nav items, table cells, metadata. The default reading weight.

**500 (medium):** Chips, subtle emphasis, hint labels that need slightly more presence than regular.

**600 (semibold):** All labels (8px uppercase), all primary values, buttons, card titles, page titles. If it's a heading or a value, it's 600.

**700 (bold):** Use sparingly and only within body copy for inline emphasis. Never for UI chrome.

### Letter Spacing Rules

Wide tracking (`+0.06–0.15em`) is applied to uppercase text at 8px to compensate for the cramped character spacing that monospace produces at small sizes in uppercase. The larger the tracking value, the higher the label hierarchy.

Negative tracking (`-0.015–0.025em`) is applied to large values (18–36px) to visually compress them into a single readable unit. At large sizes, monospace character spacing becomes too wide without compensation.

Zero tracking (0em) applies to all reading-size text (9–11px). At these sizes, the default mono spacing is correct.

**Common mistake:** Applying wide tracking to large numbers. `letter-spacing: 0.1em` on a 36px KPI value will look broken. The tracking exists to fix a legibility problem that doesn't exist at large sizes.

### The Three-Tier Card Rule

Every KPI and stat card must have exactly three typographic tiers — no more, no fewer.

```
TIER 1  8px · 600 · 0.12em · UPPERCASE · --tx-mut
        The category label: what is being measured
        Example: "AVG LATENCY", "NODES ONLINE", "ERROR RATE"

TIER 2  22–36px · 600 · negative tracking · --tx-pri
        The primary value: the current measurement
        Example: "142ms", "11", "0.04%"

TIER 3  8px chips / metadata · semantic color
        Supporting context: is this value normal?
        Example: "↑ 12ms vs 1hr ago", "9 HEALTHY", "LIVE"
```

The gap between tier 1 (8px) and tier 2 (36px) is a scanability mechanism, not drama. The eye lands on the large value first, then reads the small label for context. This is the correct reading order.

Collapsing these tiers (label and value at the same size) destroys the scanning model. Adding a fourth tier (sub-label, nested annotation) breaks the visual rhythm.

### Typography Anti-Patterns

These are the most common mistakes and why they break the system:

**Using sans for UI labels.** "It's more friendly." Friendliness is not a goal of this system. Alignment and scannability are. Sans labels in a mono table look wrong because character widths don't match.

**Using 600 weight for body copy.** Semibold at reading size (9–11px) creates visual noise — everything looks like a heading. Reserve 600 for values and explicit labels.

**Skipping a tier on a KPI card.** "The label makes it obvious." The label is not obvious at scan speed. The three tiers exist for a reason. Always include all three.

**Inconsistent uppercase application.** Labels are either always uppercase or never uppercase. Mixing them removes the structural signal that uppercase provides.

---

## 6. Color in Practice

Color in this system is signal, not decoration. Every usage rule flows from that premise.

### The Semantic Color Map

Before using any semantic color, identify the state being communicated:

| I need to communicate… | Color to use | Tokens |
|---|---|---|
| This element is interactive / can be clicked | Blue | `--blue` / `--interactive` |
| This element is currently selected / active | Blue | `--blue` / `--interactive` |
| This thing is healthy / online / successful | Green | `--green` / `--success` |
| This thing is degraded / at risk / needs attention | Amber | `--amber` / `--warning` |
| This thing is broken / offline / destructive | Red | `--red` / `--danger` |
| This is a secondary metric / auxiliary data | Violet | `--violet` / `--accent` |
| This is an identifier / name / read-only data | Teal | `--teal` |
| This is information / help / neutral context | — | Neutral text tokens |
| This is structural chrome | — | Surface / border tokens |

**If your use case doesn't appear in this table, the answer is neutral.** Don't reach for a semantic color to make something visually interesting. Structural and decorative elements use neutral tokens — `--s2`, `--bd-hi`, `--tx-sec`.

### The Semantic Triplet — Never Break It

When you use a semantic color, you must use all three layers simultaneously:

```
Text / icon:   var(--green)           Full saturation color for the signal
Background:    var(--green-d)         7-8% opacity fill — gives the element a body
Border:        1px solid var(--green-b)  18-22% opacity — gives it defined edges
```

**Why the triplet is mandatory:** On dark surfaces, a single colored text element is visually isolated. The eye sees a floating colored label with no shape or boundary. The 8% fill creates a zone; the 22% border gives it edges; the full-color text provides the signal. All three together read as a cohesive, legible element.

**What breaking the triplet looks like:**
- Color alone: floating label, looks like it belongs to a different UI
- Color + fill, no border: shapeless colored blob
- Fill + border, no color: muted and unreadable

Every badge, chip, alert, and semantic button uses the triplet. There are no exceptions.

### Fill Opacity is Capped at 8%

The dim fill (`--green-d`, `--amber-d`, etc.) is set to 7–8% opacity. This is the maximum. At higher opacities, the fill overwhelms the dark surface and creates an island of color that draws too much attention relative to its importance.

A healthy node in a table of 200 nodes should not have a background so green it dominates the table. The 8% fill communicates "healthy" while remaining subordinate to the content.

**If 8% doesn't feel visible enough, the problem is not the opacity.** The problem is the surrounding surface is wrong, or the border is missing.

### Neutral Is Not a Fallback — It's Correct

Operators learn to read semantic colors as signals. Every use of a semantic color makes an implicit claim: "pay attention to this." If you use amber for a decorative border, the operator looks up expecting a degraded service. The misfire trains distrust.

The majority of the interface should be neutral. Dark surfaces, neutral borders, muted labels. The semantic colors appear where they are earned by actual system state. This is what makes them effective — their rarity makes them noticeable.

**Ratio check:** On a healthy system dashboard, roughly 80% of visible color should be neutral (dark surfaces, subtle borders, muted text). The remaining 20% or less should be semantic. If a design is more than 20% colored, there is too much semantic color, and each instance is fighting for attention.

### Color and Status Dots

Status dots are the most spatially efficient state signal: 5 pixels of information.

| State | Color | Animation | Rule |
|---|---|---|---|
| Online / healthy | `--green` | None — static | A settled healthy state does not need animation |
| Live / streaming data | `--green` | Pulsing ring | Active data flow requires liveness signal |
| Degraded / warning | `--amber` | Pulsing ring | Degraded is an active condition needing attention |
| Offline / critical | `--red` | None — static | A broken thing is a settled state — static communicates finality |
| Unknown / stale | `--tx-dim` | None | Grey for unverified state |

**The pulse rule is semantic:** pulsing means "this is active right now." A pulsing red dot would mean "actively failing" — but failure is a settled state, not an active one. A pulsing amber dot correctly communicates "this is degrading, there's active change." Confusing static and pulsing destroys the semantic distinction.

### Color Frequency Encodes System Health

The color temperature of the dashboard is a real-time representation of system health. A healthy dashboard should look predominantly dark with occasional green dots. A degraded system should show amber. A critical failure should show red prominently.

This means the design must reserve semantic color for semantic purposes. If amber is used on every third element as a design choice, the overall amber temperature of the dashboard is meaningless. The operator cannot read system health from the color distribution.

### Teal Is Read-Only

`--teal` is assigned to identifiers: node names, service IDs, version strings, file paths, endpoint URLs. It communicates "this is a name or identifier — read-only data, not a status." Using `--teal` on interactive elements or status indicators violates its single meaning.

The practical rule: if it's a proper noun of the system (a name, an ID, a path), it's teal. If it's an operational state, it's a semantic color. If it's a label or value, it's a text token.

---
---

## Part II — Layout & Page Design

---

## 7. Page Architecture

Every dashboard page uses the same three-zone grid. This is not convention — it is information architecture. Deviating from it breaks the spatial model operators build across sessions.

### The Three Zones

```
┌──────────────────────────────────────────────────────────┐
│  TOPBAR  42px sticky  ·  identity + status + controls    │
├──────────┬───────────────────────────────────────────────┤
│          │  PAGE HEAD  title + meta + page actions       │
│          │  ──────────────────────────────────────────── │
│ SIDEBAR  │  KPI ROW  summary cards at a glance           │
│ 192px    │  ──────────────────────────────────────────── │
│ sticky   │  CHART ROW  trends over time                  │
│          │  ──────────────────────────────────────────── │
│          │  DATA SECTION  detailed tables + drill-down   │
│          │  ──────────────────────────────────────────── │
│          │  STATUS BAR  secondary nav + system meta      │
└──────────┴───────────────────────────────────────────────┘
```

**Every zone has a purpose:**
- **Topbar:** System identity, live status, global clock, quick actions, user avatar
- **Sidebar:** Section navigation, state of the monitored system (version, uptime)
- **Page head:** Page title, context metadata (last updated, peer count, region), page-level actions
- **KPI row:** High-level summary — the operator reads this first to assess overall health
- **Chart row:** Trends over time — the operator reads this second to understand trajectory
- **Data section:** Detailed data for investigation — tables, node lists, logs
- **Status bar:** Secondary navigation, build info, uptime — ambient information

### Page Content Order

Information within the main area always flows summary → detail:

1. KPI cards (aggregate numbers at a glance)
2. Charts (the same data over time)
3. Tables / node lists (individual entities with full data)
4. Status bar (ambient system metadata)

Never invert this order. A table above KPI cards forces the operator to scroll down to understand the summary of what they're looking at in detail. Start with the highest abstraction level and drill down.

### The Page Head

Every page starts with a `.ph` block. It is not optional, even for simple pages. It anchors the operator: "I am on this page, looking at this context, last updated this recently."

The page head contains, always in this order:
1. **Page title** — what section of the system this page covers (18px bold mono)
2. **Meta line** — live update time + peer count + region/environment identifier
3. **Page-level action buttons** — Export, Settings, Refresh (right-aligned)

The page title is not the product name. The topbar carries the product name. The page title is specific: "Overview", "Telemetry", "Node Detail — node-prod-07", "Deployments".

### Section Headers

Use `.shead` before every meaningful group of content: before a KPI row, before a chart row, before a table, before a different category of data. The section header is a navigation landmark, not decoration.

The section header has three parts:
- **Label** (left) — uppercase, muted, names the section
- **Horizontal rule** (center) — fills space, provides visual separation
- **Note** (right, optional) — time window, count, last-updated

Never skip section headers because "the content is obvious." What's obvious to the person who built the page is not obvious to the operator who opens it under pressure.

### Status Bar

The status bar closes every page. It provides ambient system metadata (version, uptime, build time) and quick navigation links. It is always identical across pages — operators build spatial memory for its location and use it for rapid navigation without scrolling back to the sidebar.

---

## 8. Navigation Design

### Navigation Has One Job

Navigation tells the operator where they are and gets them where they need to go. It is not a feature showcase. It is not a place to expose the full depth of the product tree. It is a small set of high-confidence destinations the operator visits repeatedly.

### Sidebar Structure

The sidebar follows a strict content order:

```
[Brand / logo]
─────────────────────────────────
SECTION LABEL  (e.g., "MONITOR")
  Nav item
  Nav item with badge
  Nav item
─────────────────────────────────
SECTION LABEL  (e.g., "CONFIG")
  Nav item
  Nav item
─────────────────────────────────
[Footer: version · uptime dot]
```

**Section labels** group related destinations. They are 8px uppercase muted — they whisper category context, they don't shout. A sidebar with too many section labels is a sidebar with too many items. Five to seven total nav items is typical. Ten is the absolute maximum before the sidebar needs a different navigation model.

**The active nav item** uses the full interactive blue triplet: `--blue` text, `--blue-d` background, `--blue` left border. This is the only time a nav item carries full color. Every other item is muted — it exists in the background until needed.

**Nav badges** appear on items only when they carry an alert count above zero. The badge is amber — it means "there is something in this section that needs your attention." Never use badges for counts that are not actionable. A badge on a nav item is a promise: if you click here, there is something to do.

**The sidebar footer** carries the system version and an uptime status dot. This is ambient information — the operator glances at it periodically. It never changes during a session. It lives in the footer so it doesn't compete with navigation.

### What Not to Put in Navigation

**Don't duplicate:** If the topbar already has a button for something (Refresh, Settings), don't also add it to the sidebar.

**Don't nest:** This system has no multi-level sidebar navigation. No dropdowns, no sub-items, no expand/collapse trees. If a section needs sub-navigation, use tabs within the page.

**Don't over-populate:** More than 10 nav items signals that the information architecture needs rethinking, not more nav items. Group pages conceptually and consolidate.

**Don't use nav for actions:** Navigation items are destinations, not triggers. "Run deployment" is not a nav item — it is a button on the Deployments page. "Export" is a page-level action button, not a nav item.

### Breadcrumbs

Breadcrumbs appear in the topbar for pages that are children of a section — typically detail views. Format: `Section Label › Page Title`. Bold the current page, plain text the parent. Maximum two levels (parent › current). Never three levels of breadcrumb.

Breadcrumbs are not needed on top-level section pages (Overview, Telemetry, Users) because the active nav item already identifies the location.

### Navigation Hierarchy Decision Tree

```
Is this a primary section of the product?
  Yes → Sidebar nav item
  No  → Is it a sub-view of a section?
          Yes → Tab on the section page OR breadcrumb in topbar
          No  → Is it a configuration or secondary tool?
                  Yes → Sidebar nav item in "Config" section
                  No  → Is it a page-level operation?
                          Yes → Button in the page head
                          No  → It probably doesn't need navigation
```

### In-Page Navigation: Tabs

When a single page has multiple views of the same data category (Overview / Events / Config), use tabs. Tab variants:

- **Underline tabs** — Default. Use for primary page-level tab switching (e.g., Node detail tabs).
- **Pill tabs** — Use for filter-level switching within a section (e.g., switching between time windows).
- **Bordered tabs** — Use when the tab panel is visually connected to the tab (the panel appears below with a shared border).

**Tab count:** Two to six tabs. More than six tabs indicates the page is doing too much. Consider splitting into separate pages with sidebar nav.

### Topbar — What Belongs There

The topbar is not a navigation bar — it is the identity and status strip. Its contents are fixed:

**Always:** Wordmark/logo · Live clock · Live status chip

**Page-contextual (right side):** Quick action buttons (Refresh, Settings) · User avatar · Sign out

**Per-section (left of spacer):** Breadcrumb for child pages

The topbar does not change its layout or structure between pages. The breadcrumb text updates, the clock ticks, the live chip pulses. Nothing else changes.

---

## 9. Grid & Spacing

### The Page Grid

The three-zone shell uses CSS Grid at the outermost level. Within the main content area, content is organized in rows. Within rows, cards use CSS Grid with fixed gap values.

**KPI card row:** `repeat(5, 1fr)` · `gap: 3px`
**Chart row:** `1fr 1fr 1fr 252px` · `gap: 3px` (three area charts + one ranked list)
**Table section:** full width, no grid

The `3px` gap between cards is not a style choice — it signals that the cards are a unified group. A 12px gap makes them look like separate page sections. The tight gap communicates: "these are facets of the same metric group."

### Spacing Scale

The spacing scale exists so there is never an arbitrary spacing value in the system. Always choose from this set:

| Token | Value | Used for |
|---|---|---|
| `--sp-1` | 4px | Minimum padding, tight inline gap (between dot and chip label) |
| `--sp-2` | 8px | Standard inline gap, chip internal padding, small margin |
| `--sp-3` | 12px | Section internal padding, medium gap |
| `--sp-4` | 16px | Page section margin, standard gap between distinct groups |
| `--sp-5` | 20px | Page head bottom margin, large internal spacing |
| `--sp-6` | 24px | Large section spacing, inter-section padding |
| `--sp-8` | 32px | Maximum spacing, page-level section separation |

**The rule: if a spacing value isn't in this list, it doesn't exist in this system.** The temptation to use `14px` or `18px` is real — resist it. Choose the closest token. The slight tension between visual ideal and the token system is resolved in favor of the token.

### Card Internal Rhythm

All cards follow the same internal spacing contract. Inconsistent internal spacing makes a grid of cards look unrelated even when they share the same border and background.

```
13px — top padding
8px  — label-to-value margin (between .kpi-top and .kv)
       (value occupies its natural height)
10px — value-to-chips margin (margin-bottom on .kv)
14px — bottom padding
```

Maximum padding on any side of a card: 14–16px. Never exceed this. Excess internal padding wastes density and visually disconnects the content from the card edge.

### The Adjacency Rule

**Two components at the same surface level must always be separated by a border.**

Two `--s1` cards with no border between them merge visually. The operator cannot tell where one ends and the other begins. The `1px var(--bd-def)` border is the visual proof that these are two distinct things.

This applies everywhere:
- Cards in a grid (the card border itself provides separation)
- Sidebar and main content area (sidebar has `border-right`)
- Topbar and content (topbar has `border-bottom`)
- Status bar sections (internal sections have divider lines)

### Height Reference

The system has several fixed-height elements that must never be changed. Their values are set to create pixel-precise alignment with the page grid.

| Element | Height | Rule |
|---|---|---|
| Topbar | 42px | Always fixed — sidebar uses `top: 42px` to align |
| Status bar | 38px | Always fixed |
| Chart container | 118px | Fixed — SVG viewBox is calibrated for this exact height |
| Sparkline | 26px | Fixed |

Buttons, inputs, and nav items have heights determined by their padding + content, not fixed heights, with the exception of the button size variants (sm: 24px, md: 30px, lg: 38px).

---

## 10. Hierarchy & Information Order

### The Scan Sequence

Operators scan, they don't read. Design for the scan sequence, not the reading sequence.

**How an operator processes a dashboard page:**

1. **Full-page sweep (< 1 second):** The eye sweeps the layout, catching the largest elements and any semantic color. At this point: is anything red? Are the large KPI values in expected ranges?

2. **Section-level scan (1–3 seconds):** The eye moves to each section header, registering category names. At this point: what sections exist? Is there an incident section?

3. **Card-level scan (3–8 seconds):** The eye reads the primary value (tier 2) of each KPI card. The labels (tier 1) are parsed peripherally for context. Semantic chips (tier 3) catch the eye if colored. At this point: what are the key numbers? Which cards show warning color?

4. **Item-level read (8+ seconds):** The operator reads specific cards, rows, or table entries in detail. This is where labels, sub-values, and metadata are fully processed.

**Design to support all four levels.** If the first-level sweep can't identify whether the system is healthy, the design has failed at its most fundamental task.

### Visual Weight Hierarchy

Not all elements deserve equal visual weight. The system assigns weight deliberately:

| Weight | What gets it | Why |
|---|---|---|
| Maximum | 36px KPI values, critical alerts | These must be seen first, no exceptions |
| High | Section headers, page title, chart axis values | These anchor comprehension |
| Medium | Table cell primary text, sub-values, nav items | Working-level information |
| Low | Labels, timestamps, metadata, hints | Context — supports the value, doesn't compete |
| Minimal | Y-axis labels, dividers, disabled text | Present for reference, recedes from scan |

Never promote information from a lower tier to a higher one without a deliberate reason. A metadata timestamp at 18px semibold is lying about its importance.

### The First Thing the Eye Should See

For every page and every section, decide: what is the most important piece of information on this screen? Then verify that it is visually dominant. The most important thing should have the largest size, heaviest weight, and highest contrast — or the brightest semantic color.

If the answer to "what is the most important thing?" is not visible as the visually dominant element, the hierarchy is wrong.

### Column Order in Tables

Table column order communicates information priority:

1. **Selection checkbox** (far left, when applicable)
2. **Primary identifier** — node name, service name, deployment name (always first content column)
3. **Status** — the most important non-identifying attribute (always close to the name)
4. **Primary metrics** — the key measurements for this entity type
5. **Secondary metrics** — supporting numbers
6. **Timestamps** — when relevant
7. **Actions** — far right, last

An operator scanning a table reads left to right. The identifier and status are the first two things they see — which is correct. They need to know "what is this thing and what state is it in" before they care about any other data.

**Never put actions in the middle of a table.** Action buttons in column 3 interrupt the data reading flow and make the table look unstructured.

---

## 11. Density & Scannability

### Density Is a Design Goal

This system is deliberately dense. An operator monitoring 200 nodes needs to see all 200 on one screen when possible, not scroll through 10 paginated views. Density serves the use case. When choosing between spacious and dense layouts, default to dense.

### How to Achieve Density Without Chaos

Density without structure is noise. The techniques that make high density legible:

**Consistent structure.** Every row in a table is identical in structure. Every card in a grid is identical in structure. The eye learns the pattern once and then reads the content, not the structure.

**Monospace alignment.** Numbers in a monospace font of the same size align vertically. The operator's eye travels down the column reading values, not scanning jagged text.

**Tight gaps between related items, looser gaps between groups.** The `3px` card gap communicates group membership. The `16px` section gap communicates separation. The spacing encodes the information architecture.

**Semantic color economy.** In a dense layout, if everything is colored, nothing stands out. If semantic colors appear only where they mean something, the eye goes directly to them. A single amber status dot on a screen of dark neutral elements is immediately visible.

**Clear typographic tiers.** In dense content, the eye needs strong size contrast to know where to land. `8px` labels and `32px` values in the same card create a clear landing point. Labels at `11px` and values at `14px` require deliberate reading, not scanning.

### Minimum Readable Density

There is a floor. Below it, elements become illegible and the density produces errors rather than efficiency. These are the minimum sizes in the system:

- Minimum **rendered** text in production: 12px (WCAG 2.0 AA; 8–11px tokens must be scaled so effective size is ≥ 12px)
- Minimum interactive element: 24×24px
- Minimum chart height: 118px (the fixed SVG viewBox height)
- Minimum status dot: 5×5px

Going below these values makes the interface hostile to the operator, not efficient.

### When to Break Density

Not every screen is maximally dense. Some contexts call for more space:

- **Modal dialogs:** More padding inside the modal because the operator is performing a deliberate focused action, not scanning
- **Empty states:** More vertical space and larger text because there is no data to fill the space
- **Error messages:** More padding and a clear visual container because the error demands deliberate reading
- **Inline help text:** More space below inputs to ensure hint text is clearly associated with its field

The rule is: density serves scanning. When the operator has stopped scanning and is reading, give them appropriate reading space.

---

## 12. Responsive Behavior

### Two Breakpoints, Applied Uniformly

| Breakpoint | What changes |
|---|---|
| `≤ 1200px` | KPI grids collapse (6-col → 3-col, 5-col → 3-col). Two-column sections go single-column. |
| `≤ 768px` | Sidebar collapses to icon-only. Topbar breadcrumb hides. KPI grid goes 2-col. |

Never introduce page-specific breakpoints. If content doesn't fit at 1200px, the layout needs to adapt to the system breakpoints, not introduce a new one at 980px.

### The Sidebar at 768px

At ≤ 768px, the sidebar collapses to 48px wide showing icons only. Labels, section headers, and the footer disappear. The topbar gains a menu button to expand the sidebar as a full-width overlay.

The collapsed sidebar still communicates the current active section through icon color. The active icon uses `--blue`; inactive icons are muted.

### Content Priority at Small Sizes

When the layout compresses, some content must yield. Priority order for what survives:

1. Primary KPI values (never remove — they are the first-priority information)
2. Status indicators (always visible — state must never require scrolling)
3. Chart container (may reduce height but never disappear)
4. Table (reduces columns, shows most important first)
5. Metadata and breadcrumbs (may truncate or hide)
6. Secondary metrics and timestamps (hide first in responsive collapse)

### What Doesn't Change at Any Size

Topbar height (42px), card internal padding rhythm, status dot sizes, semantic color rules, typography scale, and the three-tier card structure. These are invariant — they define the visual language regardless of viewport.

---
---

## Part III — Component Usage

---

## 13. Component Selection Guide

### The Decision Process

Before building anything, ask whether a component already exists for your use case. The answer is almost always yes. The system has 29 components covering the majority of dashboard needs.

**Step 1: Identify what you're trying to communicate.**
Not "I need a colored box with text" — "I need to show the operational status of a service." One is a visual description, the other identifies the component: `Badge` with a semantic variant.

**Step 2: Find the nearest existing component.**
Use the table below. If your use case matches, use the component as-is — even if it's "almost right."

**Step 3: If no component fits, check if composition solves it.**
Can you combine two existing components to achieve the result? A `Badge` inside a `DataTable` cell. A `MetricRow` inside a `Drawer`. Most "new" UI needs are compositions of existing primitives.

**Step 4: If composition doesn't solve it, build a new component following Section 21–22.**
This is the least common case. The system should be extended sparingly.

### Component Lookup by Use Case

| I need to display… | Use this |
|---|---|
| A click trigger / action | `Button` — choose variant by consequence |
| A text input from the user | `Input` with label and hint |
| A selection from a list (small) | `Select` or `Radio` group |
| A selection from a list (large, searchable) | `Command Palette` |
| An on/off toggle | `Toggle` |
| Operational status in a small space | `Badge` with semantic variant |
| An inline tag / category label | `Tag` / `Chip` |
| An informational panel (not dismissable) | `Alert` |
| A time-limited notification | `Toast` |
| A blocking decision prompt | `Modal` |
| A detail panel / side view | `Drawer` |
| Tabular data (rows of entities) | `DataTable` |
| Multiple views of one page | `Tabs` |
| Collapsible sections | `Accordion` |
| Progress of a task | `Progress bar` |
| Resource utilization | `Meter` |
| A list of steps in a process | `Stepper` |
| Events over time | `Timeline` |
| A ranked list with bar graph | Node list (dashboard pattern) |
| A hero metric | KPI card (dashboard pattern) |
| A trend over time | Area chart (dashboard pattern) |
| Empty / no data state | `Empty State` |
| Loading placeholder | `Skeleton` |
| User identity | `Avatar` |
| Date selection | `Date Picker` |
| Additional info on hover | `Popover` |
| Additional options in a menu | `Dropdown` |
| Navigating a long page | `Breadcrumb` + `Pagination` |
| An adjustable numeric value | `Slider` |

### When Not to Use a Component

Using an existing component incorrectly is worse than not using it. Don't stretch a component beyond its intended use:

- Don't use `Alert` as a decorative colored panel
- Don't use `Badge` for plain text labels that carry no semantic state
- Don't use `Modal` for small confirmation actions that fit in a `Popover`
- Don't use `Drawer` for content that belongs on its own page
- Don't use `Toast` for important messages that require acknowledgment over time
- Don't use `Progress bar` to display resource utilization (use `Meter` instead)

---

## 14. Using Primitives (Base Components)

### Button

Buttons are the primary trigger for user actions. Choose the variant based on the action's consequence, not its visual weight.

**Variant selection:**

| Variant | Use when | Example |
|---|---|---|
| `default` | Secondary, non-destructive actions | Export, Settings, Close |
| `primary` | The main recommended action on a page or dialog | Deploy, Save configuration |
| `solid` | High-emphasis primary call-to-action | Confirm (in a modal) |
| `ghost` | Cancel, dismiss, or back actions | Cancel, Go back |
| `success` | Confirmation of a healthy/go action | Mark as resolved |
| `warning` | Actions that have notable but reversible consequences | Pause, Suspend |
| `danger` | Irreversible destructive actions | Delete, Wipe, Terminate |

**Size selection:**

| Size | Height | Use when |
|---|---|---|
| `sm` | 24px | Inside tables, inside compact panels, toolbar buttons |
| `md` | 30px | Default — most contexts |
| `lg` | 38px | Page-level primary actions, modal confirm buttons |

**Rules:**
- Never put two `solid` buttons next to each other — there can only be one primary action per context
- Always pair a `danger` or `warning` button with a `ghost` cancel option
- Disabled buttons (`.is-disabled`) should remain visible — they communicate that an action exists but is currently unavailable
- Never use `default` for an action that is destructive. Even if the button is small, destructive consequences demand the `danger` variant.

**Button groups:** When multiple actions appear together, order them: Ghost (cancel/back) → Default (secondary) → Primary/Solid/Danger (primary action). The rightmost button is always the primary action.

### Badge

Badges communicate the operational state of an entity. They are read-only — they don't trigger actions.

**Choosing a badge variant:**

The variant name directly maps to operational state:
- `neutral` — no specific state, or state is not being communicated
- `success` — healthy, online, active, passing, resolved
- `warning` — degraded, at risk, pending review, approaching limit
- `danger` — offline, failed, critical, error, expired
- `info` — informational, reference data, in progress
- `accent` — special, featured, or secondary category marker

**Size selection:**

- `sm` — inside table cells, inside chips, very compact contexts
- `md` — default, most uses
- `lg` — standalone status indicators, large card context

**Rules:**
- Badges are never interactive. If a badge leads somewhere, it should be a link or a button that contains a badge.
- Always pair a badge with a meaningful text label — not just a dot or icon
- Status badges in tables must use the pulse dot variant for live/degraded states
- Never stack more than two badges horizontally on a single row

### Input

Inputs collect data from the operator. Every input must have a label. Every input that can fail validation must have a hint area for the error message.

**States to always design:**
1. Default — resting state
2. Focus — when the operator is typing
3. Error (`.is-error`) — failed validation, with error message below
4. Success (`.is-success`) — validated correctly
5. Disabled — action unavailable

**Rules:**
- Labels are always above the input, never placeholder-only
- Placeholder text is supplementary context, not a label replacement. When the operator types, the placeholder disappears — the label must persist.
- Error messages are specific. "Invalid" is not an error message. "Must be between 1–65535" is.
- Inputs inside modals and drawers: same rules, tighter vertical spacing (5px label gap instead of 8px)

**Adornments:** When an input has a fixed prefix or suffix (e.g., "https://" before a URL field, ":443" after a port field), use the input adornment pattern. The adornment is visually attached to the input — it is not a separate label.

### Toggle

Toggles control a binary on/off state — feature flags, settings, enable/disable. They are not inputs in the form-submission sense. Their state change takes immediate effect.

**When to use Toggle vs Checkbox:**
- **Toggle:** Immediate effect. Switching "Enable alerts" immediately enables alerts. No save button needed.
- **Checkbox:** Part of a form. The selection is submitted with other form data.

**Variants:**
- Default: blue when on
- `success`: green when on — use for things where on = healthy (e.g., "Monitoring active")
- `danger`: red when on — use for things where on = dangerous (e.g., "Maintenance mode")

Always label the toggle. Never rely on position alone to communicate what a toggle controls.

### Alert

Alerts communicate persistent information that the operator needs to see while working. Unlike toasts, they are not triggered by actions — they exist as part of the page content.

**When to use Alert:**
- A known issue affecting the current view that the operator should be aware of
- A configuration warning that requires action before proceeding
- Informational context about the data shown (e.g., "Showing data from 09:00–10:00 UTC")
- Deprecation notices

**When not to use Alert:**
- Triggered by an action (use Toast)
- For errors that occur during an operation (use Toast or inline error)
- As a decorative colored panel (it's not a callout box)

**Variant selection:**
- `info` — neutral context, informational, no urgency
- `success` — positive state, confirmation, resolution
- `warning` — needs attention, may affect operation
- `danger` — blocking issue, requires immediate action

Alerts are not dismissable by default. If an alert can be dismissed, the information in it is not essential — consider using a Toast instead.

---

## 15. Extended Components in Context

### Tabs

Use tabs when a single entity or section has multiple views that the operator switches between frequently. The canonical use case is a detail view: "node-prod-07" with tabs for Overview / Events / Config / Logs.

**Three tab variants and when to use each:**

**Underline tabs** (primary use): For top-level switching within a page. The active tab has a bottom border that aligns with the panel's top edge. Use when the tabs are the dominant navigation on the page.

**Pill tabs**: For secondary switching within a section. Switching between "1h / 6h / 24h" time windows. Switching between "All / Online / Offline" filters. Use when the tabs control a view parameter rather than a full content switch.

**Bordered tabs**: For tabs that are visually connected to their panel content. The active tab appears as if it's part of the panel below it (shared border treatment). Use for primary content areas with clear panel boundaries.

**Tab count:** 2–6 tabs. More than 6 is a signal that the page is doing too much. Consider: should some of these be separate pages with sidebar navigation?

**Rules:**
- Tab labels are 2–4 words maximum
- Badge counts on tabs indicate unread or actionable items — use sparingly
- Never put tab-within-tab (nested tabs) — use a different information architecture

### Modal

Modals interrupt the operator's workflow and demand attention. Use them only for content that genuinely requires focused attention before proceeding.

**When to use Modal:**
- Confirmation of an important or irreversible action
- A focused form that creates or edits an entity
- A detail view of an item when a Drawer doesn't fit (wide content)
- A destructive confirmation with typed input

**When not to use Modal:**
- For informational content the operator reads without acting (use Alert or a page section)
- For quick confirmations with low stakes (use inline confirmation or a Popover)
- For content the operator needs to reference while continuing to work (use Drawer)
- For navigation (use a page)

**Size selection:**
- `sm` (360px): Simple confirmations, small forms, alerts with a single action
- Default (480px): Standard forms, moderately complex confirmations
- `lg` (640px): Complex forms with multiple sections, detail views, multi-step content

**Anatomy of a well-designed modal:**
1. **Title** — names what the modal is for (not "Confirm" — "Delete Node?")
2. **Body** — explains consequences, shows the form, provides context
3. **Footer** — Ghost cancel (left) + Primary/Danger action (right)

**Destructive modal rule:** When the modal confirms a permanent deletion or data loss, require typed confirmation. The user must type the name of the thing being deleted before the confirm button enables. This prevents accidents and ensures deliberate intent.

### Drawer

Drawers provide a side panel that appears over the page without fully blocking it. The operator can see page context while interacting with the drawer content.

**When to use Drawer:**
- Entity detail view while keeping the list visible for context
- Quick editing of a single entity's properties
- Expanded view of a table row
- A configuration panel that applies to visible page content

**When not to use Drawer:**
- For content that needs the full page width
- For multi-step workflows that would benefit from their own page
- For warnings or alerts (use Toast or Alert)

**Drawer width is fixed at 360px.** Do not create custom-width drawers. The 360px is calibrated so the main content remains readable alongside it at standard desktop widths.

### Data Table

The Data Table is one of the most important components in the system. An operator monitoring 200 nodes lives in tables. Design them carefully.

See Section 17 for full table design guidelines.

### Command Palette

The command palette is a global keyboard-triggered search and action launcher. It is optional — include it on pages where the operator would benefit from keyboard-first navigation or quick access to a large set of actions.

**When to include a Command Palette:**
- Pages with more than 10 possible actions
- Admin pages where experienced operators work primarily with keyboard
- Search-heavy workflows (find a specific node, log entry, or deployment)

**Trigger:** `⌘K` (Mac) / `Ctrl+K` (Windows). Always visible in the topbar as a keyboard hint.

**Content:** Commands are grouped by category. Each command has a label, keyboard shortcut (if applicable), and a description for disambiguation. Search is instant and fuzzy.

### Toast

Toasts are the system's action feedback mechanism. Every user action that modifies data must produce a toast confirming success or reporting failure.

See Section 20 for full feedback and notification guidelines.

---

## 16. Dashboard Patterns

Dashboard patterns are higher-level constructs built from primitives. They are not individual components — they are specific, repeatable combinations of components and layout that serve dashboard use cases.

### Widget sizing (small / medium / large)

Dashboard widgets use a simple three-tier sizing system, encoded as the `WidgetSize` type in `widgets.types.ts`:

- **Small (`"small"`)** — single KPI or micro visual. Fits comfortably in a 1×1 tile with one primary value and minimal context (e.g. `KpiNumberWidget`, node sparklines, alert strips).
- **Medium (`"medium"`)** — standard dashboard card. One primary metric plus 1–3 supporting chips, meters, or a small sparkline (e.g. `SessionsWidget`, `ApiLatencyWidget`, `TelemetryWidget`, `ClusterLoadWidget`, `ServersSummaryWidget`, `IncidentsWidget`).
- **Large (`"large"`)** — composite or drilldown area. Grids of cards, tables, or stacked panels that take over a major section of the page (e.g. VPN node grid and drilldown panels).

The `Widget` primitive accepts an optional `size` prop (`"small" | "medium" | "large"`), which maps to layout classes (`.ds-widget--sm`, `.ds-widget--md`, `.ds-widget--lg`) and adjusts card min-heights. New dashboard widgets should:

- Default to **medium** unless they are a single KPI/micro visual (then **small**) or a composite/table that owns a major section (then **large**).
- Use the `size` prop consistently so the grid can rely on it for density and future span rules, instead of hardcoding per-widget layout tweaks.

### KPI Card

A KPI card is a focused metric display: one category, one primary value, supporting context.

**KPI card is the right pattern when:**
- Displaying a single aggregate number that summarizes a key aspect of system state
- The number needs to be readable at scan speed from across a row of similar cards
- The number has context (comparison, unit, live status) that supports it

**KPI card is the wrong pattern when:**
- Displaying a list or collection (use a table or node list)
- Displaying a trend (add a sparkline or use a chart card)
- Displaying more than one primary value (it's two cards, not one)

**Anatomy:**
```
[LEFT EDGE ACCENT — 2px, semantic color]
┌──────────────────────────────────┐
│ CATEGORY LABEL         View ›   │  ← Tier 1
│ Sub-label text                  │
│                                 │
│ 142                             │  ← Tier 2 (large value)
│  ms                             │    (with unit suffix)
│                                 │
│ [CHIP: ↑ 12ms]  [CHIP: LIVE]   │  ← Tier 3
└──────────────────────────────────┘
```

**Left edge accent color selection:**
The edge accent categorizes what type of data the card measures, so the operator can orient within a row of cards without reading labels:

| Edge | Category | Examples |
|---|---|---|
| Blue (`.eb`) | Interactive / primary | Sessions, active connections, peer count |
| Green (`.eg`) | Health / freshness | Uptime, health score, fresh nodes |
| Amber (`.ea`) | Risk / incident | Warning count, incident count, at-risk metrics |
| Red (`.er`) | Errors / failures | Error rate, offline count, critical count |
| Violet (`.ev`) | Secondary metrics | P99 latency, secondary throughput |
| Teal (`.et`) | Infrastructure | Cluster CPU, infrastructure load |

**The edge accent is not a status indicator.** A card about sessions has a blue edge whether sessions are nominal or critical. The edge communicates *category*, not *state*. State is communicated by the chips (tier 3) and the semantic colors within the card.

### Chart Card

An area chart card shows the same metric as a KPI card, but over time. Use chart cards when the trend is as important as the current value.

**When chart cards and KPI cards coexist** (the standard dashboard layout):
- KPI cards form the first row: current values at a glance
- Chart cards form the second row: trends for the same metrics
- The chart row is visually subordinate to the KPI row — operators read the KPI row first

**What a chart card contains:**
- The same category label as the corresponding KPI card (for correspondence)
- The SVG area chart at the card's full width
- The current value displayed prominently (either inside the chart or as a sub-header)
- Time window labels on the x-axis
- The fourth panel in the chart row is always a ranked node list, not another chart

**Chart color assignment:**
- Primary series: `--chart-blue` (#4878e8)
- Secondary series (if needed): `--chart-violet` (#7858d8)
- Never add a third series — two lines is the maximum for legibility at dashboard density

### Ranked Node List

The ranked node list appears as the fourth column in the chart row. It shows the top N entities for a metric in ranked order, with an inline proportional bar.

This pattern communicates: "within this metric category, which entities are dominant?"

**Anatomy per row:**
```
[RANK] [STATUS DOT] [NAME in teal]    [VALUE]  [BAR ████████░░]
```

**Rules:**
- Rank 1 always gets a bar at 100% width. All other bars are relative to rank 1.
- Status dots follow the standard status-dot rules (green static, amber pulsing, red static)
- Names truncate with ellipsis — never wrap
- Offline nodes appear at the bottom with a strikethrough name and 0% bar

---

## 17. Tables

Tables are where operators spend most of their time. The `DataTable` component is the mandatory implementation for all tabular data. Never build ad-hoc table markup.

### When to Use a Table

Use a table when you are displaying a collection of entities of the same type, each with multiple attributes. A list of nodes. A list of deployments. A list of users. A list of events.

Do not use a table for:
- A single entity with multiple attributes (use a detail layout or drawer)
- A small collection (≤ 3 items) with a single attribute (use a list or chips)
- Comparison of two things (use a side-by-side layout)

### Column Design

#### Order

Columns always follow this left-to-right priority:

1. **Selection checkbox** (when bulk actions exist)
2. **Primary identifier** — the name, ID, or most distinguishing attribute. Always first, always in teal.
3. **Status** — the operational state. Always second. This is the attribute the operator needs alongside the name.
4. **Primary metrics** — the key measurements for this entity type (e.g., CPU, RAM, connections)
5. **Secondary attributes** — region, zone, environment, timestamps
6. **Actions** — the rightmost column, always

Never put actions in the middle. The table reads left-to-right in priority order; actions at the end mean the operator has read everything they need before deciding what to do.

#### Column Count

Seven columns maximum. Beyond seven, the table becomes unreadable at standard viewport widths without horizontal scrolling. If you need more than seven columns, split into two tables or use a drawer for secondary attributes.

#### Column Width

Some columns have natural widths:

- Selection checkbox: 36px (fixed)
- Status badge: 90–120px (fixed, badge fits exactly)
- Action buttons: 80–120px (fixed, 1–2 buttons)
- Primary identifier: flexible (takes remaining space)
- Numeric metrics: 80–100px (fixed, number fits with units)

Allow the identifier column to flex — names vary in length and the identifier should use the available space.

#### Sortable Columns

Numeric columns and timestamps should be sortable. The name column should be sortable for alphabetical navigation. Status should be sortable so the operator can bring all offline nodes to the top.

Sortable columns have a sort indicator arrow. One column is sorted at a time. The sorted column header is slightly brighter than unsorted headers.

### Row Design

#### Row Accent Classes

Row accent classes communicate the aggregate state of an entity:

- `.row-success` — entity is in a good state (2px left border in green)
- `.row-warning` — entity needs attention (2px left border in amber)
- `.row-danger` — entity is in a critical state (2px left border in red)
- No class — neutral/unknown state

**Rules for row accents:**
- Row accent is determined by the most critical attribute. A node with CPU at 90% gets `.row-warning` even if all other attributes are nominal.
- Row accent does not replace the status badge — both are present
- Never use row accent for non-semantic reasons (e.g., alternating row colors for visual rhythm)

#### Hover State

Table rows should have a hover state: background shifts to `--s2`. This is the only state change on a row hover. No border change, no scale change, no animation.

The hover state communicates interactivity (clicking a row reveals detail) without drawing attention in the resting state.

#### Row Height

Table rows should be dense. The minimum row height is approximately 36–38px (content + 8px top + 8px bottom padding). Never inflate row height for visual spaciousness. In a dense table, the operator can see more rows and make comparisons more efficiently.

### Cell Content Rules

These rules are absolute — they apply to every table in the system:

| Content type | Rule |
|---|---|
| Empty / null / undefined | Display `—` (em-dash) in `--tx-mut`. Never leave blank. |
| Numbers | Right-aligned, monospace, `tabular-nums`. Include units. |
| Percentages | Trailing `%`, right-aligned. Color the value if above a threshold. |
| Node names / service names | `--teal` color. Truncate with ellipsis — never wrap. |
| Hash values / IDs | `--tx-mut` color, 10px. Truncate to first 8–12 chars + ellipsis. |
| Timestamps | `--tx-mut` color, 11px. Use relative time ("2m ago") for recent, absolute for older. |
| URLs / endpoints | `--info` color. Truncate. Always fits on one line. |
| Status | Badge component with semantic variant. |

### Table Toolbar

Every table with more than 20 rows should have a toolbar with:
- **Search/filter input** — instant filter as the operator types
- **Result count** — "N nodes" or "Showing N of total"
- **Bulk actions** (when selection exists) — appear when rows are selected
- **Secondary actions** — Export, column visibility toggle (right-aligned)

The toolbar filter does not require a submit button. It filters on every keystroke. If the dataset is large enough that client-side filtering is impractical, debounce at 200ms before making a server request.

### Pagination

Use pagination when the dataset exceeds 200 rows. Virtual scrolling is acceptable as an alternative for very large datasets.

Pagination shows: previous button · page numbers (with ellipsis for long ranges) · next button · rows-per-page selector.

Default rows per page: 25. Options: 25 / 50 / 100.

---

## 18. Charts & Data Visualization

### When to Use Charts

Charts are for showing trends over time, not for displaying single values. A metric's current value belongs in a KPI card. That same metric's value over the last hour belongs in a chart.

**Use a chart when:**
- The trend is as important as the current value
- The operator needs to see rate of change, not just point-in-time state
- You are showing the relationship between two series over time

**Don't use a chart when:**
- You only have a single data point (use a KPI card)
- The operator needs exact values (use a table)
- You have more than two data series (split into multiple charts)

### Chart Anatomy

All charts in this system are SVG area charts with a fixed structure:

1. **Gradient fill** — tinted area below the line, communicates the area under the curve
2. **Line** — the primary data signal. Drawn with cubic bezier curves, never polylines.
3. **Grid lines** — horizontal reference lines at y-axis intervals (very subtle, `rgba(255,255,255,.025)`)
4. **Y-axis labels** — values at grid line intersections (muted, `#28404e`)
5. **X-axis labels** — time stamps at even intervals (muted, same color)
6. **Endpoint dot** — marks the current value at the right edge of the chart

**Fixed dimensions:**
- Container height: 118px
- SVG viewBox: `0 0 300 118`
- Content area: x 22–298, y 10–100
- These values are invariant — the SVG stretches to fill its container width

### Chart Color and Meaning

Chart colors are not semantic in the same way as status colors. They are series-identification colors:

- `--chart-blue` (#4878e8) — primary series
- `--chart-violet` (#7858d8) — secondary series (second line on same chart)

**Maximum two series per chart.** More than two lines at dashboard density is illegible. If you need to show three series, use two charts side by side.

For sparklines within KPI cards: use `--green` for a positive/healthy metric trend, `--chart-blue` for a neutral metric, `--amber` for a concerning trend. This is the one case where sparkline color carries semantic meaning.

### Chart Labeling

Every chart needs:
- A category label (shared with its corresponding KPI card)
- Time window on the x-axis (not just "Time" — "09:52 → 10:51")
- Unit on the y-axis (Mbps, ms, %, requests/s)
- Current value either as an endpoint dot label or in the card header

What charts don't need:
- Chart legends for single-series charts (the color IS the series)
- Tooltips on hover for operator-facing data (the exact value is in the KPI card)
- Titles that repeat the card label above them

### Data Update Behavior

Charts show live data. When new data arrives:
- The line extends to the right by the new point
- The oldest point on the left shifts off the visible window
- No full re-render animation — the extension is smooth, continuous

The draw-in animation (`.cl` class) runs only on initial page load, not on data updates. An animation on every data update would be distracting in a live monitoring context.

---

## 19. Forms & Inputs

### Form Architecture

This system has no `<form>` elements. All form patterns use `div` containers with `onClick` handlers. This is an architectural constraint, not a style choice.

Every input-containing view is one of three types:

**Settings panel:** A collection of related settings that save together. Usually in a page section or a Drawer. Has a "Save changes" button that saves all modified fields at once.

**Action modal:** A form that collects parameters for a specific action. Has a cancel button and a labeled action button (not "Submit" — "Deploy", "Create node", "Update config").

**Inline edit:** A single field that saves on blur or on Enter. Used for renaming, quick threshold edits. No visible save button — the action is the keystroke.

### Label Conventions

Every input has a label. Labels:
- Are positioned above the input (never inline or to the side)
- Are 9px uppercase mono in `--tx-sec`
- Describe what to enter, not what the field name is. "API Key" describes the field name. "Your API key from the Settings page" describes what to enter.
- Never include a colon after them (the visual separation of label above input is sufficient)

Required fields have no special asterisk marking in this system. Instead, the error state activates when the operator submits without filling a required field — the red error message below the input makes the requirement clear in context.

### Validation

Validation is always inline — the error message appears immediately below the field that failed, not in a toast or at the top of a form.

**Validation timing:**
- Validate on blur (when the operator leaves the field) for format validation
- Validate on change for real-time feedback (e.g., password strength)
- Never validate on the first character — wait until the operator has had a chance to complete the value

**Error message rules:**
- Specific: names the constraint. "Invalid format" → "Must be a valid IPv4 address"
- Actionable: tells the operator what to do. "Too short" → "Minimum 8 characters"
- Lowercase (except proper nouns) — error messages are not headings
- No trailing period

**Success state:** Show `.is-success` on the input after validation passes, but only if the operator has engaged with the field. Don't pre-mark all fields as success before the operator has touched them.

### Password and Sensitive Fields

Sensitive inputs (API keys, passwords, tokens):
- Type `password` by default with a show/hide toggle button
- Placeholder text is always `••••••••` (masked dots)
- Never show the value in the label or breadcrumb after entry
- When confirming deletion with a typed name (modal pattern), use `type="text"` — the input is confirming intent, not securing data

---

## 20. Feedback & Notifications

### The Feedback Contract

Every user action that modifies data must produce visible feedback. Silence after an action creates uncertainty — the operator doesn't know if it worked.

| Action type | Immediate feedback | Completion feedback |
|---|---|---|
| Submitting a form | Button enters loading state | Toast: success or danger |
| Starting a background job | Button enters loading, badge changes to "In Progress" | Toast when complete |
| Deleting an entity | Button enters loading | Toast: success (dismissable) or danger (requires close) |
| Toggling a setting | Toggle state changes immediately | No toast needed — the toggle IS the feedback |
| Filtering a table | Table updates immediately | No toast — change is visible |
| Navigation | Nothing — page change is the feedback | — |

### Toast Usage Guide

**Success (auto-dismisses in 5s):** The operation completed. The operator should see this and move on. Don't require them to close it.

**Info (auto-dismisses in 5s):** Background information about something that completed. "Fetching 4 hours of telemetry data — this may take a moment."

**Warning (requires manual close):** Something completed but with caveats, or a condition has changed that the operator should know about. "Deployment succeeded, but 2 of 11 nodes failed to pull the image."

**Danger (requires manual close):** The operation failed, or a critical condition occurred. The operator must acknowledge this. Dismissing it is their sign that they've registered the failure and will act on it.

**Toast content rules:**
- Title: 3–6 words, names the outcome ("Deployment failed", "Node deleted", "Config saved")
- Description: 1–2 sentences, adds the relevant detail ("3 nodes failed to respond. Check the Incidents page for details.")
- Never just a title with no description for warning or danger toasts
- Never wrap more than 2 lines in the description — if you need more, link to a page

**Toast placement:** Bottom-right, stacked from bottom up. The most recent toast is at the top of the stack. Maximum 4 toasts visible at once — older ones are dismissed as new ones arrive.

### Empty States

An empty state is not an error. It is valid system state. Design it as a first-class experience.

Every empty state answers three questions:
1. **Why is this empty?** — "No nodes match your current filter" vs "No nodes have been added yet" vs "No data in this time range"
2. **Is this expected?** — "All incidents have been resolved" (positive) vs "Unable to load data" (negative)
3. **What should the operator do?** — "Clear filter" / "Add your first node" / "Adjust time range" / "Check your connection"

Empty states use the `EmptyState` component. Never display a blank area, an indefinitely spinning loader, or a table with zero rows and no explanation.

### Loading States

Loading states communicate that data is coming. The correct loading indicator in this system is always the skeleton shimmer — never a spinner.

**Skeleton rules:**
- Skeleton elements match the height and approximate shape of the content they'll replace
- A card in loading state shows skeleton elements for the label tier, value tier, and chip tier
- A table in loading state shows 5–8 skeleton rows at the correct row height
- Skeleton loading never blocks page interaction — the rest of the page is usable while data loads in sections

**Never show a page-level loading spinner.** This blocks the operator's entire view while data loads. Load sections independently and show skeleton in each section.

---
---

## Part IV — Building New Components

---

## 21. When to Create a New Component

Creating a new component is a significant decision. It adds to the system's maintenance surface, creates a new pattern that future designers and developers must learn, and risks fragmenting the visual language if done poorly. Before creating anything new, apply this checklist in order.

### The Pre-Build Checklist

**1. Does an existing component already solve this?**
Review the component lookup table in Section 13. If anything is even close, examine it more carefully. The existing component might handle your case with a different variant or size.

**2. Can this be composed from two or more existing primitives?**
Most apparent "new component" needs are actually compositions. A "status summary row" is a `Badge` + a label + a `MetricRow`. A "user card in a drawer" is an `Avatar` + basic text layout. Before building, sketch the composition.

**3. Can an existing component be extended with a new variant?**
If you need "a badge but with a violet color for a secondary metric," that's a new variant on `Badge` (`badge-accent`), not a new component. Adding a variant to an existing component is far less costly than a new component.

**4. Is this a dashboard pattern, not a component?**
KPI cards, chart cards, and node lists are patterns — specific compositions of primitives for specific dashboard use cases. If what you need is a pattern, document it as a pattern, not a component.

**5. Will this be used in three or more places?**
If you need this in only one place, it's probably a page-specific layout, not a reusable component. Don't build a component for a one-off need. Build the layout once, inline.

**If you've passed all five checks:** you have a genuine new component need. Proceed to Section 22.

### The Types of New Components

When you do create something new, it will be one of three types:

**Atomic primitive:** A single-purpose, indivisible UI element. Comparable to existing base components. Examples: a new type of status indicator, a specialized chip variant, a compact value display.

**Composite component:** A specific, reusable combination of primitives for a recurring use case. Comparable to the KPI card or node list patterns. Examples: a deployment row, a log entry, a health summary panel.

**Layout component:** A structural container that positions other components. Examples: a split-panel layout, a metric group container, a card grid with a specific column pattern.

Each type has different documentation requirements and maintenance implications. Atomic primitives require the full 10-step process from Section 22. Composite components require structure documentation and token contracts. Layout components require CSS documentation and responsive behavior specification.

---

## 22. How to Design a New Component

Follow these steps in order. Skipping steps is the primary cause of components that look slightly off or that fail QA.

### Step 1 — Define the Job

Name the specific problem this component solves and describe it in one sentence.

> "This component shows a single log entry with timestamp, severity, source, and message in a compact row suitable for a high-density log stream."

If you can't write this sentence, you don't have a clear enough problem definition. Go back to the user need.

Then answer three questions:

**Surface layer:** Where does this component live visually?
- Shell (`--s0`): topbar, sidebar, status bar
- Card/input (`--s1`): most components, default assumption
- Hover/elevated (`--s2`): adornments, dropdown rows
- Active/overlay (`--s3`): pressed states, tooltips
- Track/inset (`--s4`): meter fills, skeleton backgrounds

**Semantic meaning:** Does this component communicate operational state?
- Yes → It needs semantic variant support (success/warning/danger) and must use the triplet
- No → It uses neutral surface and border tokens only

**Interaction model:** Is this interactive or read-only?
- Interactive → needs `:hover`, `:focus-visible`, `:active`, `:disabled` states
- Read-only → states are driven by data, not user interaction; no focus ring needed

### Step 2 — Define the Token Contract

Before writing a single CSS rule, list every token the component will consume. This forces deliberate decisions and prevents token drift.

```
COMPONENT: [name]
Type: [interactive | read-only | overlay | inline]
Layer: [shell | card | hover | active | track]
─────────────────────────────────────────────────
Background:       --s1
Border (default): --bd-def
Border (hover):   --bd-hi       ← only if interactive
Border (focus):   --bd-focus    ← only if interactive
Text primary:     --tx-pri
Text label:       --tx-mut
Text secondary:   --tx-sec
Semantic fill:    --{variant}-d  ← only if semantic
Semantic border:  --{variant}-b  ← only if semantic
Semantic text:    --{variant}    ← only if semantic
Radius:           --r (2px interactive) or --rc (3px card)
Transition:       [specific properties, durations, easings]
Font:             --font-mono (all UI text)
─────────────────────────────────────────────────
Nothing outside this list.
```

**If you find yourself writing a token that doesn't exist** (`--s5`, `--bd-stronger`, a custom rgba value), stop. Either the existing tokens are sufficient and you're solving the wrong problem, or you need to request a new token. Never invent a value.

### Step 3 — Name the Component and Its Parts

Apply the naming convention:

```
.{component}              → base class, required on every instance
.{component}-{size}       → sm | md | lg
.{component}-{variant}    → semantic variant (success|warning|danger|info|accent)
.{component}.is-{state}   → runtime state (.is-loading, .is-disabled, .is-error, .is-open)
.{component}__element     → child element (double underscore)
.{component}--modifier    → layout modifier (double dash)
```

**Naming prohibitions:**
- No `camelCase` in class names
- No color names in class names (`.green-row` → `.row-success`)
- No new abbreviations that aren't already in the system
- No generic names that conflict with existing components (`card`, `panel`, `box`, `wrapper`)

### Step 4 — Design All States

Before writing any HTML or CSS, enumerate every visual state this component can be in. For each state, describe what changes visually.

**For read-only components:**

| State | How to trigger | What changes |
|---|---|---|
| Default | Base | Full-opacity render of base styles |
| Success | `.my-component-success` | Green triplet applied |
| Warning | `.my-component-warning` | Amber triplet applied |
| Danger | `.my-component-danger` | Red triplet, possible left border reinforcement |
| Loading | `.is-loading` | Skeleton shimmer replaces content |
| Empty | `.is-empty` | Value shows `—`, accent dims, hint text appears |

**For interactive components:**

| State | Trigger | What changes |
|---|---|---|
| Default | — | Base styles |
| Hover | `:hover` | Background → `--s2`, border → `--bd-hi` |
| Focus | `:focus-visible` | `box-shadow: 0 0 0 2px rgba(58,140,255,.2)` |
| Active | `:active` | Background → `--s3` |
| Disabled | `[disabled]` or `.is-disabled` | `opacity: 0.3; pointer-events: none` |
| Selected | `.is-active` / `.on` | Full semantic color (bg + border + text) |

**Rule:** If a state is not explicitly designed, it does not exist. Don't rely on browser defaults to handle hover or focus states.

### Step 5 — Write the CSS

Follow the canonical block order — this is not style convention, it is a structural requirement for maintainability:

```css
/* ══════════════════════════════════════════════════════
   COMPONENT-NAME
   ──────────────────────────────────────────────────────
   Usage:    <div class="my-component [sm|lg] [success|warning|danger]">
   States:   default · success · warning · danger · loading · disabled
   Tokens:   --s1, --bd-def, --tx-mut, --tx-pri, --font-mono
   Children: __label · __value · __meta
   Since:    v2.x
══════════════════════════════════════════════════════ */

/* 1. Base shell */
.my-component {
  /* layout — display, grid/flex, alignment */
  /* surface — background, border, border-radius */
  /* typography — font, size, color */
  /* transitions — only named properties */
}

/* 2. Child elements */
.my-component__label { }
.my-component__value { }
.my-component__meta  { }

/* 3. Size modifiers */
.my-component-sm { }
.my-component-lg { }

/* 4. Semantic variants */
.my-component-success { color: var(--success); background: var(--success-dim); border-color: var(--success-border); }
.my-component-warning { color: var(--warning); background: var(--warning-dim); border-color: var(--warning-border); }
.my-component-danger  { color: var(--danger);  background: var(--danger-dim);  border-color: var(--danger-border);  }
.my-component-info    { color: var(--info);    background: var(--info-dim);    border-color: var(--info-border);    }

/* 5. Interactive states (if interactive) */
.my-component:hover         { background: var(--s2); border-color: var(--bd-hi); }
.my-component:focus-visible { box-shadow: 0 0 0 2px rgba(58,140,255,.2); outline: none; }
.my-component:active        { background: var(--s3); }
.my-component[disabled],
.my-component.is-disabled   { opacity: 0.3; pointer-events: none; cursor: not-allowed; }

/* 6. Runtime states */
.my-component.is-loading { }
.my-component.is-empty   { }
```

**One rule = one responsibility.** Never combine hover + variant + size in a single selector chain. The cascade is your friend — let it work.

### Step 6 — Write the Canonical HTML Structure

Every component has one canonical HTML structure. Document it in a comment block. Every instance must match this structure exactly. Structural deviation is a bug.

```html
<!-- MY-COMPONENT
  Required:    .my-component (always)
  Size:        .my-component-sm | .my-component-lg
  Semantic:    .my-component-success | -warning | -danger | -info
  State:       .is-loading | .is-disabled | .is-empty
  ARIA:        [list required ARIA attributes]
  ──────────────────────────────────────────── -->

<div class="my-component [size] [variant] [state]" [aria-attributes]>
  <div class="my-component__label">LABEL</div>
  <div class="my-component__value">
    42
    <span class="my-component__unit">ms</span>
  </div>
  <div class="my-component__meta">
    <span class="chip cn">CONTEXT</span>
  </div>
</div>
```

### Step 7 — Add Motion (If Needed)

Add animation only if it communicates a state change or eases a spatial transition. If you cannot name what the animation communicates, remove it.

**Allowed animation uses:**

| Situation | What to use | How |
|---|---|---|
| Page-load entrance | `fadeup` keyframe | `animation: fadeup 0.4s cubic-bezier(.22,1,.36,1) both` |
| Live / streaming state | `ringpulse` on status dot | `animation: ringpulse 2s ease infinite` |
| Loading skeleton | `shimmer` keyframe | Already in `.skeleton` class |
| Bar/meter initial fill | Width 0 → value | `transition: width .9s cubic-bezier(.22,1,.36,1)` |
| Overlay entrance | `opacity + translateY` | See modal/drawer patterns |

**Never add new keyframes** without establishing that the animation need is not already covered by an existing keyframe.

### Step 8 — Write the React Component

```tsx
type MyComponentVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type MyComponentSize    = 'sm' | 'md' | 'lg';

interface MyComponentProps {
  label:      string;
  value:      string | number;
  unit?:      string;
  variant?:   MyComponentVariant;
  size?:      MyComponentSize;
  loading?:   boolean;
  className?: string;
}

export function MyComponent({
  label, value, unit,
  variant   = 'default',
  size      = 'md',
  loading   = false,
  className = '',
}: MyComponentProps) {
  const classes = [
    'my-component',
    size    !== 'md'      ? `my-component-${size}`    : '',
    variant !== 'default' ? `my-component-${variant}` : '',
    loading               ? 'is-loading'               : '',
    className,
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={classes}>
        <div className="skeleton" style={{ height: 8, width: '60%', borderRadius: 2 }} />
        <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 2, marginTop: 8 }} />
      </div>
    );
  }

  return (
    <div className={classes}>
      <div className="my-component__label">{label}</div>
      <div className="my-component__value">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="my-component__unit">{unit}</span>}
      </div>
    </div>
  );
}
```

**React constraints (enforced by ESLint):**
- No inline `style` prop in `admin/src/**` and `shared/src/ui/**`
- No `<form>` elements
- No `localStorage` or `sessionStorage`
- Named exports only (no `export default`)
- Default values in destructuring, not inside the function body
- All numbers through `toLocaleString()` or a `formatNumber` utility

### Step 9 — Document It

Four documentation artifacts are required before the component is considered complete:

**CSS comment block** (in the component's CSS file): Covers usage, states, tokens, children, and version. See the template in Step 5.

**Component inventory entry** (in the system spec, Section 8 or 9): One row in the component table showing base class, variants, sizes, and states.

**Typography map entry** (in `dashboard-typography-map.md`): Documents which CSS class maps to which React component and which typographic role.

**QA checklist item** (in the PR checklist): A specific checkbox for this component's most common failure modes.

### Step 10 — Pre-PR Verification

Before requesting review, run through this checklist:

```
Tokens
  ✓ Every color is var(--)
  ✓ No hex values outside :root
  ✓ Surface depth matches visual layer

Typography  
  ✓ All UI text: --font-mono
  ✓ Body prose only: --font-sans
  ✓ Font sizes from the 8-size scale
  ✓ No font-size in inline style props

HTML structure
  ✓ Matches canonical structure from Step 6
  ✓ No <form> tags
  ✓ No inline style attributes

Visual states
  ✓ All states designed (hover, focus, active, disabled, loading, empty)
  ✓ Warning/live dots animate with ringpulse
  ✓ Loading uses skeleton shimmer, not a spinner

Motion
  ✓ Entrance uses fadeup
  ✓ No JS-driven visual animations
  ✓ Transitions name only changing properties

Accessibility
  ✓ :focus-visible ring on all interactive elements
  ✓ icon-only buttons have aria-label
  ✓ Error states have aria-invalid + aria-describedby
  ✓ ARIA roles per component type (Section 27)

Code
  ✓ Named React export
  ✓ No inline styles
  ✓ Numbers formatted via toLocaleString()
  ✓ pnpm lint passes clean
```

---

## 23. Composing with Primitives

Most interface needs are compositions, not new components. Understanding how to compose primitives well is more valuable than knowing when to build new ones.

### Composition Principles

**Primitives are building blocks, not solutions.** A `Badge` doesn't solve the problem of showing a node's status — it is one piece of a solution that also involves a table row, a status dot, and the correct column position.

**Compositions should be invisible.** The operator should not be able to tell where one primitive ends and another begins. A well-composed layout reads as a single designed unit, even though it's assembled from six separate components.

**Don't fight the component's shape.** If you're overriding 70% of a component's CSS to make it fit your composition, you probably need a different component or a new one. Compositions work best when each primitive is used close to its intended design.

### Common Composition Patterns

**Card + Table:** A KPI card at the top of a section followed immediately by a table of the underlying data. The section header `.shead` separates them. The card gives the aggregate; the table gives the detail.

**Drawer + Form:** An entity detail drawer containing an input form for editing. The drawer provides the side-panel context; the form inputs provide the editing interface. The drawer footer holds the Save/Cancel buttons.

**Modal + Accordion:** A complex form modal where related fields are grouped into accordion sections. Reduces visual complexity by collapsing less-important field groups.

**Tabs + DataTable:** A tabbed page where each tab shows a filtered view of the same underlying data. The tabs act as a persistent filter; the DataTable renders the filtered result.

**Badge inside DataTable cell:** The most common composition in the system. The cell contains a `Badge` with the entity's status variant. The badge is inside a `.cell-status` div that controls the column width. The badge's semantic variant is determined by the entity's state.

### Composition Anti-Patterns

**Nesting the same component type:** A card inside a card. A modal inside a modal. These are always wrong — use the appropriate depth level instead.

**Using a component as a layout container:** Wrapping an `Alert` around an entire form section to give it a colored background. The `Alert` communicates a system message — it is not a styled div. Use surface tokens and borders for layout containment.

**Overriding component CSS to fit a composition:** If you need `margin: -1px` or `border-radius: 0` to make a component fit into a composition, the composition approach is wrong. Adjust the layout, not the component.

---

## 24. Design Patterns & Recipes

These are documented solutions for recurring design problems. Use them directly before building something from scratch.

### Pattern: Entity Detail View

When the operator selects a row from a table and wants to see full detail for that entity.

**Implementation:** `Drawer` for quick reference. Separate page (`/nodes/node-prod-07`) for full detail with actions.

Use a drawer when:
- The operator wants to see detail while keeping the list visible
- The detail is primarily read-only
- The detail fits in 360px width

Use a separate page when:
- The operator will take multiple actions on the entity
- The detail has sub-navigation (tabs within the entity)
- The detail content is wider than 360px

### Pattern: Bulk Actions on a Table

When the operator needs to perform the same action on multiple entities simultaneously.

**Implementation:** Selection checkbox column (first column). Bulk action bar appears above the table when rows are selected, replacing the normal toolbar. Bulk action bar shows: "N selected" label + action buttons + clear selection button.

Bulk action buttons use the same variant rules as individual action buttons. Bulk delete uses `danger`. Bulk restart uses `warning`.

### Pattern: Progressive Disclosure in Forms

When a form has required fields and optional advanced fields that most operators won't need.

**Implementation:** Required fields visible by default. Advanced fields in an Accordion below. Accordion label: "Advanced settings" or "Additional options". Accordion is collapsed by default.

Never use a Tab for this — tabs are for parity views, not required/optional hierarchy.

### Pattern: Confirmed Destructive Action

For any action that permanently deletes data or has severe irreversible consequences.

**Three-tier implementation:**

1. **Low stakes** (soft delete, easily recoverable): `danger` button with a tooltip on hover explaining the consequence.

2. **Medium stakes** (hard to undo): Modal with: title naming the thing being deleted + warning message + Cancel button + Danger confirm button.

3. **High stakes** (permanent, data loss): Modal with: title + impact statement + typed confirmation input + disabled Danger button that enables only when typed name matches.

### Pattern: Live Status Dashboard Section

A section of the page showing real-time operational state.

**Structure:**
1. Section header with a live chip (`<div class="live-chip">...</div>`) on the right
2. KPI row (5 cards, 3px gap)
3. Chart row (3 area charts + 1 ranked node list, 3px gap)
4. Incident sub-grid below the incident KPI card

The section header's right side shows the data freshness: "Last 1 hour · Updated 30s ago".

### Pattern: Configuration Page

A page for managing system settings — not live data monitoring.

**Structure:**
1. Page head with page title + description
2. Settings sections separated by `.shead` headers
3. Each section contains related input fields with labels and hints
4. A floating "You have unsaved changes" notice when fields have been modified
5. Save/Discard buttons in the page head actions

Settings pages have more internal padding than monitoring pages. Inputs need breathing room for labels, error messages, and hint text.

---

## Part V — Quality & Governance

---

## 25. Interaction Design

### Every Interactive Element Needs All Four States

Design every interactive element in all four states before considering it done:

**Default:** The component at rest. This is what the operator sees before they've done anything.

**Hover:** Communicates that the element will respond if clicked. Surface steps up, border brightens. Transition: 0.10–0.15s ease.

**Focus (`:focus-visible`):** Communicates keyboard navigation position. 2px blue ring: `box-shadow: 0 0 0 2px rgba(58,140,255,.2)`. Required for every focusable element.

**Disabled:** Communicates that the element exists but is currently unavailable. `opacity: 0.3; pointer-events: none`. Element remains visible — it should not be hidden.

**Active (`:active`):** Optional for most elements. Required for buttons — a brief darkening on mousedown confirms the click was registered.

### Affordance Design

The visual treatment of interactive elements must communicate their nature before the cursor arrives. In a dense dashboard, an operator cannot hover over every element to discover what's clickable.

**Buttons:** Have explicit borders and backgrounds. Even ghost buttons (transparent) become visible on hover. An element that looks invisible at rest but appears on hover is an affordance failure in this system.

**Links / clickable names:** Use `--teal` for node names and service identifiers that are clickable. Use `--blue` for explicit link text. Never use `--tx-pri` for a clickable element — it's identical to non-clickable primary text.

**Table rows:** Hovering a row that leads to a detail view changes the row background. The cursor changes to pointer. This is the combined signal for "this row is interactive."

**Icon buttons:** Must have a visible boundary (border or background). An icon floating in space with no visual container is not recognizable as a button.

### Feedback Timing

Interactive responses should feel immediate. The perceived response time matters:

- **Hover:** Visible within 1 frame (~16ms). CSS transitions at 0.08–0.15s are fast enough to feel immediate while being visible.
- **Focus:** Immediate (no transition needed).
- **Click:** The action state (loading spinner, disabled) should apply within 1 frame. The network request may take seconds — the UI response should not.
- **Success toast:** Appears as soon as the server confirms. Never delay it artificially.

### Cursor Rules

| Situation | Cursor |
|---|---|
| Interactive button / link / tab | `pointer` (default for `<button>` and `<a>`) |
| Disabled element | `not-allowed` |
| Sortable column header | `pointer` |
| Draggable element | `grab` / `grabbing` |
| Resizable separator | `col-resize` or `row-resize` |
| Regular text / non-interactive | `default` |

Never apply `cursor: pointer` to a non-interactive element to make it "look more clickable." If it needs pointer cursor, it should be an actual interactive element.

---

## 26. Motion & Animation

### The Motion Vocabulary

Every animation in the system communicates something specific. This is the complete vocabulary:

| Animation | What it communicates | Keyframe |
|---|---|---|
| `fadeup` | Content has appeared on this page | `opacity 0→1 + translateY 6px→0` |
| `ringpulse` | This thing is live, streaming, or actively degraded | Ring expands and fades from the dot |
| `shimmer` | Content is loading / placeholder | Horizontal light sweep across the skeleton |
| `drawline` | Chart data has just been rendered from a fetch | Line draws from left to right |
| Meter fill | A value has been measured and is being displayed | Bar fills from 0 to its value |
| Overlay entrance | A modal/drawer/dropdown has appeared | `opacity + translateY/scale` |

**If your animation doesn't appear in this table, question whether it belongs.**

### Stagger on Entrance

When multiple cards or components enter the page simultaneously, stagger their `fadeup` delays by 0.04s per element. This creates the perception of the page materializing in a wave — less jarring than all elements appearing at once.

```css
.card:nth-child(1) { animation-delay: 0.00s; }
.card:nth-child(2) { animation-delay: 0.04s; }
.card:nth-child(3) { animation-delay: 0.08s; }
/* ... etc */
```

Apply stagger to the first row of cards. Subsequent sections don't need stagger — only the initial page paint.

### The Static vs Animated Rule

**Pulsing = active state.** Animation communicates "this is changing, happening, or streaming right now."

**Static = settled state.** No animation communicates "this has reached a stable condition."

Applied to status dots:
- Green + static: healthy, not live-streaming
- Green + pulse: live data streaming
- Amber + pulse: degraded right now, active condition
- Red + static: offline — this is broken, it's not "actively breaking", it's just broken

### Easing Reference

| Duration | Easing | Used for |
|---|---|---|
| 0.08–0.12s | `ease` | Micro-interactions (hover, row highlight) |
| 0.15–0.18s | `ease` | Component transitions (modal, fade) |
| 0.22s | `cubic-bezier(.22,1,.36,1)` | Spatial transitions (drawer slide) |
| 0.40s | `cubic-bezier(.22,1,.36,1)` | Page-level entrances (fadeup) |
| 0.90s | `cubic-bezier(.22,1,.36,1)` | Value-based fills (meters, progress) |
| 1.60s | `ease infinite` | Skeleton shimmer |
| 2.00s | `ease infinite` | Status dot pulse |

The spring easing (`cubic-bezier(.22,1,.36,1)`) is used for spatial transitions because it slightly overshoots then settles — communicating physicality. It should never be used for micro-interactions like hover states.

---

## 27. Accessibility Practice

### The First Rule

Design for accessibility from the start, not as a retrofit. An element that was never designed with keyboard navigation or screen reader structure in mind requires much more work to fix than one designed correctly from the beginning.

### Focus Management

**Use `:focus-visible`, not `:focus`.**
`:focus` adds a ring on every interaction including mouse clicks. `:focus-visible` adds it only for keyboard navigation. Mouse users don't need the ring — they can see where their cursor is. Keyboard users do.

**Never remove the focus ring without replacing it.**
`outline: none` is acceptable if immediately followed by `box-shadow: 0 0 0 2px rgba(58,140,255,.2)`. It is never acceptable on its own.

**Trap focus in overlays.**
When a modal or drawer is open, Tab should cycle only through elements inside it. Pressing Tab when focus is on the last element should return to the first. This prevents keyboard users from accidentally navigating the background while an overlay is open.

**Return focus on close.**
When a modal or drawer closes, focus must return to the element that triggered it. An operator who navigated to the Delete button, used a modal to confirm deletion, and finds their focus dumped to the document body has been abandoned.

### Color Accessibility

**Every semantic signal that uses color must also use a second channel.**

| Signal | Color channel | Second channel |
|---|---|---|
| Status (online/warning/offline) | Green / Amber / Red dot | Dot animation (pulsing = active) + aria-label text |
| Form validation | Green / Red border | Icon (✓ / ✕) + error text below the field |
| Alert type | Color panel left border | Icon glyph (ℹ / ✓ / ⚠ / ✕) + title text |
| Badge state | Color fill + border | Text label ("Online", "Degraded", "Offline") |
| Row state | Color left border | Status badge in the row |
| Table sorting | Sort icon color | Arrow direction (↑ / ↓) |

### Required ARIA Per Component Type

These are not optional. Every component must include its required ARIA:

| Component type | Required ARIA |
|---|---|
| Modal / Drawer | `role="dialog"` `aria-modal="true"` `aria-labelledby="{title-id}"` |
| Tab list | `role="tablist"` on container |
| Tab button | `role="tab"` `aria-selected="true/false"` |
| Tab panel | `role="tabpanel"` |
| Accordion toggle | `aria-expanded="true/false"` `aria-controls="{panel-id}"` |
| Dropdown trigger | `aria-haspopup="listbox"` `aria-expanded="true/false"` |
| Progress bar | `role="progressbar"` `aria-valuenow` `aria-valuemin` `aria-valuemax` |
| Invalid input | `aria-invalid="true"` `aria-describedby="{hint-id}"` |
| Icon-only button | `aria-label="[action description]"` |
| Status dot | `aria-label="[state description]"` |
| Toast | `role="alert"` (danger) or `role="status"` (success/info) |
| Sortable column | `aria-sort="ascending/descending/none"` on `<th>` |

### Keyboard Navigation Completeness

Test with keyboard only — no mouse:

- Every interactive element reachable with Tab
- Tab order follows visual reading order (left-to-right, top-to-bottom)
- Dropdowns: `↑`/`↓` to navigate, `Enter` to select, `Escape` to close
- Modals: `Escape` closes, focus trapped inside
- Tabs: `←`/`→` to move between tabs, `Enter` to activate
- Accordion: `Enter` to toggle
- Data table: Tab to move cells, `Space` to select rows

---

## 28. Decision Framework

### The Seven Questions

Apply these in order. Stop when you have an answer.

**1. Does the design system already solve this?**
Check Section 13. If anything is close, use it — even if imperfect.

**2. Can this be composed from existing primitives?**
Sketch the composition. Most needs are compositions.

**3. Which of the six core principles does this implicate?**
Name them. Let them constrain the solution space.

**4. What is the operator's state when they encounter this?**
Scanning? Reading? Performing an action? Under pressure? Design for the actual state, not the relaxed ideal state.

**5. What state is being communicated?**
Name the state explicitly. Is the visual treatment the most direct available channel for that state?

**6. What could go wrong?**
Name the failure modes. Is the error state designed? The empty state? The loading state? The disabled state?

**7. Does any element exist for reasons other than communicating information?**
If yes: remove it.

### The Restraint Test

Before finalizing any design, point at each element and name what information it carries. If you can't name it, it should be removed.

"It provides visual balance" is not information. "It separates two distinct sections" is information (use `.shead` or a border). "It indicates live data streaming" is information (use a pulsing chip). Everything must earn its place.

### The 2am Test

Before shipping any design: imagine an operator who has just been woken at 2am because of an alert. They open this page on their phone in a dark room, under stress, not fully alert.

- Can they identify the most important information within 2 seconds?
- Can they take the most urgent action within 5 seconds?
- Does anything on this page demand more cognitive load than the operational situation itself?

If any answer is no, the design needs revision.

---

## 29. Quality Standards

### Definition of Done

A component or page is not done until all of these are true:

**Visual completeness:**
- All states designed: default, hover, focus, active, disabled, loading, empty, error
- Three-tier card hierarchy where applicable
- All semantic variants implemented
- Left-edge accent present on all KPI and chart cards
- Edge color matches data category

**Token compliance:**
- Every color is `var(--)` — no hex values outside `:root`
- Surface levels match visual depth
- Semantic colors use the full triplet
- Font family from tokens only
- Border-radius within system limits (2px/3px/6px)

**Typography:**
- All UI text: IBM Plex Mono
- Body prose: IBM Plex Sans
- Font sizes from the 8-size scale
- Labels uppercase with correct tracking
- Numbers formatted (not raw integers or floats)
- Empty values as `—`, never blank or `null`

**Motion:**
- Entrance uses `fadeup` with stagger
- Transitions specify only changing properties (no `transition: all`)
- No JS-driven visual animations
- Status dots: warning/live pulse, critical/static correct

**Accessibility:**
- `:focus-visible` ring on all interactive elements
- Color not the only signal (second channel present)
- All ARIA per component type (Section 27)
- Keyboard navigation complete
- All interactive elements ≥ 24×24px

**Code quality:**
- No inline `style` props (React)
- No `<form>` elements
- No `localStorage` / `sessionStorage`
- Named React exports
- `pnpm lint` passes clean

### Code Review Checklist

These are grounds for requesting changes on any PR:

```
✗ Hex color value in component CSS (not in :root)
✗ Semantic color used without the full triplet
✗ border-radius > 3px on a component
✗ box-shadow for elevation within the page
✗ IBM Plex fonts not used (any other font present)
✗ Inline style prop in React component
✗ <form> element in the HTML
✗ status dot: static amber or pulsing red
✗ Loading state uses spinner instead of skeleton
✗ Empty state is a blank area or zero-row table
✗ Null/undefined displayed directly in a table cell
✗ transition: all in CSS
✗ Numbers unformatted (raw integers or floats)
✗ Missing :focus-visible ring on interactive element
✗ Missing aria-label on icon-only button
✗ Missing aria-invalid on invalid input field
✗ Table columns in wrong order (actions not last)
✗ More than 2 data series on a single chart
✗ KPI card with fewer than 3 typographic tiers
✗ pnpm lint has new warnings
```

---

> This handbook, the design system specification, and the anti-patterns reference form a complete trilogy. The handbook explains intent and practice. The spec provides implementation details. The anti-patterns catalogue catalogs what not to do and why. When they conflict, the handbook principles take precedence — they describe what the system is trying to be. Update the spec and anti-patterns to match the principles, never the reverse.