---
title: Primitives Extended — Datasheet
version: 2.0.0
type: datasheet
scope: ai-agent-reference
system: primitives-design-system
theme: dark-terminal
last_updated: 2026-03-02
fonts: ["IBM Plex Mono", "IBM Plex Sans"]
dependencies: []
files: ["primitives.html", "primitives-extended.html"]
---

# Primitives Extended — Datasheet

> Machine-readable component reference for AI agents. Use token names, class names, and prop values directly in generation prompts.

---

## System Identity

| Property        | Value                            |
|-----------------|----------------------------------|
| System name     | Primitives                       |
| Version         | 2.0.0                            |
| Theme           | Dark terminal                    |
| Font — UI       | IBM Plex Mono                    |
| Font — Body     | IBM Plex Sans                    |
| Dependencies    | None (pure HTML/CSS/JS)          |
| JS required     | Interaction only (no framework)  |
| Total components| 29 (v1: 11 + v2: 18)            |
| Semantic variants| 6                               |
| Size scale      | 3 (sm / md / lg)                 |

---

## Design Tokens — Quick Reference

### Surface & Background

| Token              | Value     | Role                              |
|--------------------|-----------|-----------------------------------|
| `--bg`             | `#0D0F10` | Root page background              |
| `--surface-1`      | `#121618` | Component backgrounds             |
| `--surface-2`      | `#171B1E` | Elevated surfaces, adornments     |
| `--surface-3`      | `#1D2226` | Active/pressed, tooltips          |
| `--surface-4`      | `#232A2F` | Deepest inset surfaces            |
| `--border-subtle`  | `#1E2428` | Section dividers, hairlines       |
| `--border-default` | `#252B30` | All component default borders     |
| `--border-bright`  | `#2E363C` | Hover / elevated borders          |
| `--border-focus`   | `#3A8CFF` | Focus rings (all focusable elems) |

### Text

| Token               | Value     | Role                         |
|---------------------|-----------|------------------------------|
| `--text-primary`    | `#C8D2DA` | Headings, values, emphasis   |
| `--text-secondary`  | `#8A9AA8` | Body text, labels            |
| `--text-muted`      | `#4E5E6A` | Placeholders, metadata       |
| `--text-disabled`   | `#313C44` | Disabled state text          |
| `--text-inverse`    | `#0D0F10` | Text on solid blue buttons   |

### Semantic Colors

Each semantic color exports three tokens:

| Name          | Base token        | Base hex  | Dim (bg)                    | Border                      |
|---------------|-------------------|-----------|-----------------------------|-----------------------------|
| interactive   | `--interactive`   | `#3A8CFF` | `--interactive-dim` (8%)    | `--interactive-border` (22%)|
| success       | `--success`       | `#3DBA6A` | `--success-dim` (8%)        | `--success-border` (22%)    |
| warning       | `--warning`       | `#E8A020` | `--warning-dim` (8%)        | `--warning-border` (22%)    |
| danger        | `--danger`        | `#E85050` | `--danger-dim` (8%)         | `--danger-border` (22%)     |
| info          | `--info`          | `#4A9EE8` | `--info-dim` (8%)           | `--info-border` (22%)       |
| accent        | `--accent`        | `#A070E8` | `--accent-dim` (8%)         | `--accent-border` (22%)     |

### Spacing

| Token   | Value  |
|---------|--------|
| `--sp-1`| `4px`  |
| `--sp-2`| `8px`  |
| `--sp-3`| `12px` |
| `--sp-4`| `16px` |
| `--sp-5`| `20px` |
| `--sp-6`| `24px` |
| `--sp-8`| `32px` |

### Radius

| Token     | Value  | Used on                            |
|-----------|--------|------------------------------------|
| `--r-sm`  | `2px`  | Buttons, inputs, badges, tags      |
| `--r-md`  | `3px`  | Cards, alerts, modals, panels      |
| `--r-lg`  | `6px`  | Reserved / large containers        |

### Typography

| Token         | Family           | Weights       | Used on                         |
|---------------|------------------|---------------|---------------------------------|
| `--font-mono` | IBM Plex Mono    | 300,400,500,600| Buttons, badges, inputs, labels |
| `--font-sans` | IBM Plex Sans    | 300,400,500   | Descriptions, body copy, hints  |

---

## Component Inventory — v1 (11 components)

| # | Component   | Base class         | Variants                                             | Sizes      | States                              |
|---|-------------|--------------------|------------------------------------------------------|------------|-------------------------------------|
| 1 | Button      | `.btn`             | default · primary · solid · ghost · success · warning · danger | sm/md/lg | normal · hover · disabled          |
| 2 | Input       | `.input`           | default · prefix · suffix adornment                  | —          | default · focus · error · success · disabled |
| 3 | Textarea    | `.input` (textarea)| default                                              | —          | default · focus · disabled          |
| 4 | Select      | `.input` (select)  | default                                              | —          | default · focus · disabled          |
| 5 | Checkbox    | `.checkbox-wrap`   | default · danger                                     | —          | unchecked · checked · indeterminate · disabled |
| 6 | Radio       | `.radio-wrap`      | default                                              | —          | unselected · selected · disabled    |
| 7 | Toggle      | `.toggle-wrap`     | default · success · danger                           | —          | off · on · disabled                 |
| 8 | Badge       | `.badge`           | neutral · success · warning · danger · info · accent | sm/md/lg   | static · pulse                      |
| 9 | Tag/Chip    | `.tag`             | default                                              | —          | default · hover · removable         |
|10 | Alert       | `.alert`           | info · success · warning · danger                    | —          | static                              |
|11 | Progress    | `.progress-wrap`   | info · success · warning · danger · indeterminate    | —          | static · animated                   |

---

## Component Inventory — v2 (18 components)

| # | Component       | Base class            | Variants                          | Interactive | JS needed |
|---|-----------------|-----------------------|-----------------------------------|-------------|-----------|
| 1 | Tabs            | `.tabs`               | underline · pill · bordered       | Yes         | Yes       |
| 2 | Accordion       | `.accordion`          | default                           | Yes         | Yes       |
| 3 | Modal / Dialog  | `.modal-backdrop`     | default · danger · sm · lg        | Yes         | Yes       |
| 4 | Dropdown Menu   | `.dropdown-menu`      | default                           | Yes         | Yes       |
| 5 | Command Palette | `.cmd-palette`        | default                           | Yes         | Yes       |
| 6 | Data Table      | `.data-table`         | default (with toolbar)            | Yes         | Optional  |
| 7 | Breadcrumb      | `.breadcrumb`         | default · collapsed               | No          | No        |
| 8 | Pagination      | `.pagination`         | default                           | Yes         | Optional  |
| 9 | Toast           | `.toast`              | info · success · warning · danger | Yes         | Yes       |
|10 | Stepper         | `.stepper`            | horizontal · vertical             | No          | No        |
|11 | Timeline        | `.timeline`           | default                           | No          | No        |
|12 | Slider          | `input[type="range"]` | default · success · warning · danger | Yes      | No (CSS)  |
|13 | Date Picker     | `.datepicker-wrap`    | default                           | Yes         | Yes       |
|14 | Popover         | `.popover-host`       | default (hover)                   | Hover-only  | No (CSS)  |
|15 | Avatar          | `.avatar`             | default · blue · green · orange · red · purple | No | No      |
|16 | Empty State     | `.empty-state`        | default                           | No          | No        |
|17 | Meter / Gauge   | `.meter-wrap`         | info · success · warning · danger · segmented | No | No   |
|18 | Drawer          | `.drawer-backdrop`    | default (right-side)              | Yes         | Yes       |

---

## Composite Patterns — Widgets & KPI Cards

Widgets are **page-level cards** composed from base primitives:

| Pattern        | Structure                                     | Notes                                   |
|----------------|-----------------------------------------------|-----------------------------------------|
| Widget card    | `.card.widget`                               | Generic dashboard/card container        |
| KPI widget     | `.card.widget.kpi`                           | Short metric card, min-height 160px     |
| Header layout  | `.widget__header` → title + subtitle + action| Aligns title block with right-aligned KPIs or deltas |
| Title          | `.widget__title` + `type-h4` (`CardTitle`)   | Card / widget titles                    |
| Subtitle       | `.widget__subtitle` + `type-body-xs` (`Caption`)| Secondary label / timeframe         |
| KPI value      | `.kpi__value` + `type-data-xl/lg` (`KpiValue`)| Primary metric number                  |
| KPI meta       | `.kpi__meta` · `.kpi__meta-item`             | Chips for secondary metrics / tags     |

Use widgets for **dashboard-like surfaces** on `Overview`, `Telemetry`, `Servers`, and `Devices` pages.

---

## Class Naming Convention

```
.{component}[-{modifier}][-{variant}]

Examples:
  .btn                         → base (required)
  .btn .btn-md .btn-primary    → base + size + variant
  .badge .badge-sm .badge-danger → base + size + variant
  .input .is-error             → base + state (no dash on state)
  .tabs .tabs-pill             → base + layout variant
  .modal .modal-danger         → base + semantic variant
  .avatar .avatar-lg .blue     → base + size + color utility
```

---

## Quick Usage Reference

### Buttons

```html
<!-- Default -->
<button class="btn btn-md btn-default">Label</button>

<!-- Primary (interactive blue) -->
<button class="btn btn-md btn-primary">Deploy</button>

<!-- Solid filled -->
<button class="btn btn-md btn-solid">Confirm</button>

<!-- Ghost -->
<button class="btn btn-md btn-ghost">Cancel</button>

<!-- Danger -->
<button class="btn btn-md btn-danger">Delete</button>

<!-- Small + icon -->
<button class="btn btn-sm btn-default">
  <svg class="btn-icon" ...></svg> Filter
</button>

<!-- Disabled (any variant) -->
<button class="btn btn-md btn-primary" disabled>Loading</button>
```

### Badge — Static + Pulse

```html
<!-- Static -->
<span class="badge badge-md badge-success">Nominal</span>
<span class="badge badge-md badge-warning">Warning</span>
<span class="badge badge-md badge-danger">Critical</span>

<!-- Pulse (live status) -->
<span class="badge badge-md badge-success">
  <span class="dot pulse"></span>Online
</span>

<!-- Count -->
<span class="badge-count danger">12</span>
```

### Input — Validation States

```html
<!-- Default -->
<div class="input-wrap">
  <label class="input-label">Field</label>
  <input type="text" class="input" placeholder="Value">
</div>

<!-- Error -->
<input type="text" class="input is-error" value="bad_value">
<span class="input-hint is-error">Invalid format</span>

<!-- Success -->
<input type="text" class="input is-success" value="valid@email.io">
<span class="input-hint is-success">Looks good</span>

<!-- Prefix adornment -->
<div class="input-group">
  <span class="input-adornment left">https://</span>
  <input type="text" class="input" placeholder="domain.io">
</div>
```

### Toggle

```html
<label class="toggle-wrap [success|danger]">
  <input type="checkbox" class="toggle-input" [checked] [disabled]>
  <span class="toggle-track">
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-label">Label</span>
</label>
```

### Alert

```html
<!-- Icons: info=ℹ  success=✓  warning=⚠  danger=✕ -->
<div class="alert [info|success|warning|danger]">
  <span class="alert-icon">✓</span>
  <div class="alert-body">
    <div class="alert-title">Title</div>
    <div class="alert-desc">Description text.</div>
  </div>
</div>
```

### Tabs — All Variants

```html
<!-- Underline -->
<div class="tabs tabs-underline">
  <div class="tab-list">
    <button class="tab-btn active" onclick="switchTab(this,'panel-a')">Tab A</button>
    <button class="tab-btn" onclick="switchTab(this,'panel-b')">Tab B <span class="tab-badge">3</span></button>
  </div>
  <div id="panel-a" class="tab-panel active">Content A</div>
  <div id="panel-b" class="tab-panel">Content B</div>
</div>

<!-- Pill -->
<div class="tabs tabs-pill"> ... same structure ... </div>

<!-- Bordered -->
<div class="tabs tabs-bordered"> ... same structure ... </div>
```

### Modal

```html
<div class="modal-backdrop" id="my-modal">
  <div class="modal [modal-sm|modal-lg] [modal-danger]">
    <div class="modal-header">
      <span class="modal-title">Title</span>
      <button class="modal-close" onclick="closeModal('my-modal')">×</button>
    </div>
    <div class="modal-body">Body content.</div>
    <div class="modal-footer">
      <button class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

```js
// Open / close
document.getElementById('my-modal').classList.add('open');
document.getElementById('my-modal').classList.remove('open');
```

### Dropdown Menu

```html
<div class="dropdown">
  <button class="btn btn-default" onclick="toggleDropdown('dd1')">Actions ▾</button>
  <div class="dropdown-menu" id="dd1">
    <div class="dropdown-label">Section</div>
    <button class="dropdown-item">
      Item
      <span class="item-shortcut">⌘D</span>
    </button>
    <div class="dropdown-sep"></div>
    <button class="dropdown-item danger">Delete</button>
  </div>
</div>
```

### Data Table

```html
<div class="data-table-wrap">
  <div class="table-toolbar">
    <input class="table-search" placeholder="Filter…">
    <span class="table-count">N results</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:36px;"><input type="checkbox" class="t-check"></th>
        <th class="sortable sort-asc">Name <span class="sort-icon">↑</span></th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr class="row-success">
        <td><input type="checkbox" class="t-check"></td>
        <td><span class="cell-primary">node-01</span></td>
        <td><span class="t-badge success">Online</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

Row accent classes: `.row-success` · `.row-warning` · `.row-danger`
Cell classes: `.cell-primary` · `.cell-mono` · `.cell-muted`
Table badge classes: `.t-badge.success` · `.t-badge.warning` · `.t-badge.danger` · `.t-badge.info` · `.t-badge.neutral`

### Stepper — Horizontal

```html
<div class="stepper">
  <div class="step completed">
    <div class="step-circle">✓</div>
    <div class="step-label">Step 1</div>
    <div class="step-sub">Done</div>
  </div>
  <div class="step active">
    <div class="step-circle">2</div>
    <div class="step-label">Step 2</div>
    <div class="step-sub">In progress</div>
  </div>
  <div class="step pending">
    <div class="step-circle">3</div>
    <div class="step-label">Step 3</div>
    <div class="step-sub">Waiting</div>
  </div>
</div>
```

Step state classes: `.completed` · `.active` · `.pending` · `.error`

### Timeline

```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-track">
      <div class="timeline-dot [success|warning|danger|info|neutral]"></div>
    </div>
    <div class="timeline-body">
      <div class="timeline-header">
        <span class="timeline-title">Event title</span>
        <span class="timeline-time">4m ago</span>
      </div>
      <div class="timeline-content">Description of what happened.</div>
      <div class="timeline-actor">service-name · context</div>
    </div>
  </div>
</div>
```

### Avatar

```html
<!-- Sizes -->
<div class="avatar avatar-sm blue">AB</div>
<div class="avatar blue">AB</div>
<div class="avatar avatar-lg blue">AB</div>

<!-- With status -->
<div class="avatar blue" style="position:relative;">
  AB
  <div class="avatar-status [online|away|busy|offline]"></div>
</div>

<!-- Group -->
<div class="avatar-group">
  <div class="avatar blue">AB</div>
  <div class="avatar green">CD</div>
  <div class="avatar avatar-more">+3</div>
</div>
```

Color classes: `.blue` · `.green` · `.orange` · `.red` · `.purple`

### Toast — Programmatic

```js
// Trigger a toast notification
showToast('success', 'Deployment complete', 'All 12 nodes updated to v2.4.1.');
showToast('warning', 'High CPU', 'node-07 at 84%.');
showToast('danger',  'Node offline', 'eu-west-1a unreachable.');
showToast('info',    'Update ready', 'v2.5.0-rc available.');
// Auto-dismisses after 5000ms
```

### Progress & Meter

```html
<!-- Progress bar -->
<div class="progress-wrap">
  <div class="progress-meta">
    <span>Label</span><span>67%</span>
  </div>
  <div class="progress-track">
    <div class="progress-bar [info|success|warning|danger]" style="width:67%"></div>
  </div>
</div>

<!-- Meter (thicker, gradient) -->
<div class="meter-wrap">
  <div class="meter-label"><span>CPU</span><span>83%</span></div>
  <div class="meter-track">
    <div class="meter-fill [info|success|warning|danger]" style="width:83%"></div>
  </div>
</div>

<!-- Segmented (10-segment health score) -->
<div class="meter-segmented">
  <div class="meter-seg filled success"></div> <!-- repeat per score -->
  <div class="meter-seg"></div>                <!-- empty segments -->
</div>
```

### Slider

```html
<!-- Default (blue thumb) -->
<input type="range" min="1" max="100" value="50">

<!-- Semantic thumb color -->
<input type="range" class="success" min="0" max="16" value="8">
<input type="range" class="warning" min="0" max="100" value="80">
<input type="range" class="danger"  min="0" max="100" value="95">
```

### Drawer

```html
<div class="drawer-backdrop" id="my-drawer">
  <div class="drawer">
    <div class="drawer-header">
      <span class="drawer-title">Title</span>
      <button class="drawer-close" onclick="closeDrawer()">×</button>
    </div>
    <div class="drawer-body">Content</div>
    <div class="drawer-footer">
      <button class="btn btn-ghost btn-sm">Close</button>
      <button class="btn btn-primary btn-sm">Action</button>
    </div>
  </div>
</div>
```

```js
document.getElementById('my-drawer').classList.add('open');
document.getElementById('my-drawer').classList.remove('open');
```

### Empty State

```html
<div class="empty-state">
  <div class="empty-icon">📭</div>
  <div class="empty-title">No results found</div>
  <div class="empty-desc">Try adjusting your filters or search terms.</div>
  <button class="btn btn-default">Clear filters</button>
</div>
```

---

## Semantic Variant Map

| Variant     | Use when                                               | Color       | Avoid using for                     |
|-------------|--------------------------------------------------------|-------------|-------------------------------------|
| `neutral`   | Inactive, default, unknown state                       | `#8A9AA8`   | Errors, warnings                    |
| `success`   | Online, healthy, completed, confirmed                  | `#3DBA6A`   | Pending or in-progress states       |
| `warning`   | Degraded, elevated risk, needs attention               | `#E8A020`   | Critical failures or successes      |
| `danger`    | Offline, error, destructive action, validation failure | `#E85050`   | Minor warnings                      |
| `info`      | Informational, in-progress, selected interactive       | `#4A9EE8`   | Errors or successes                 |
| `accent`    | Special tags, secondary CTAs, metadata                 | `#A070E8`   | Primary actions or alerts           |

---

## Size Scale

| Token | Height (buttons) | Font size | Padding    | Letter spacing |
|-------|-----------------|-----------|------------|----------------|
| `sm`  | 24–26px         | 9px       | 0 10px     | 0.08–0.09em    |
| `md`  | 30px            | 10px      | 0 14px     | 0.07–0.08em    |
| `lg`  | 38px            | 11px      | 0 18px     | 0.05–0.07em    |

---

## Focus & Accessibility

All interactive components expose `:focus-visible` styles:

```css
box-shadow: 0 0 0 2px rgba(58, 140, 255, 0.2);
/* or */
border-color: var(--border-focus);  /* for inputs */
```

| Component         | Required ARIA                                    |
|-------------------|--------------------------------------------------|
| Button (icon-only)| `aria-label="[action]"`                          |
| Input             | `aria-describedby="hint-id"` when hint present   |
| Input (error)     | `aria-invalid="true"`                            |
| Checkbox (indet.) | Set via JS: `element.indeterminate = true`       |
| Badge (pulse)     | `aria-label="Status: [value]"`                   |
| Tag remove btn    | `aria-label="Remove [tag-name]"`                 |
| Progress bar      | `role="progressbar" aria-valuenow aria-valuemin aria-valuemax` |
| Modal             | `role="dialog" aria-modal="true" aria-labelledby="modal-title"` |
| Drawer            | `role="dialog" aria-modal="true"`               |

---

## Animation Reference

| Component     | Property          | Duration | Easing                      |
|---------------|-------------------|----------|-----------------------------|
| Badge pulse   | `box-shadow`      | 2s       | `ease` infinite             |
| Toggle thumb  | `transform`       | 0.15s    | `ease`                      |
| Progress bar  | `width`           | 0.4s     | `ease`                      |
| Modal         | `transform, opacity` | 0.18s | `ease`                     |
| Drawer        | `transform`       | 0.22s    | `cubic-bezier(.22,1,.36,1)` |
| Toast in      | `opacity, transform` | 0.2s  | `ease`                      |
| Dropdown      | `opacity, transform` | 0.12s | `ease`                      |
| Accordion     | `max-height`      | 0.25s    | `ease`                      |
| Skeleton      | `background-position` | 1.6s | `ease` infinite             |
| Datepicker    | `opacity, transform` | 0.12s | `ease`                     |

---

## Anti-Patterns

| ❌ Do not                                  | ✓ Do instead                                   |
|--------------------------------------------|------------------------------------------------|
| Hardcode `color: #3DBA6A`                  | Use `color: var(--success)`                    |
| Use inline styles for spacing              | Use `--sp-*` tokens or component classes       |
| Mix mono and sans on the same label        | Buttons/badges → mono · Descriptions → sans   |
| `border-radius > 3px` on components       | Max `--r-sm` (2px) components, `--r-md` (3px) cards |
| Use `box-shadow` for depth/elevation       | Use surface color steps + border-color changes |
| Use light backgrounds                      | All surfaces must be `--bg` or `--surface-*`   |
| Fill semantic bg > 10% opacity             | Cap at 8% (use `--success-dim`, etc.)          |
| Use Inter, Roboto, system-ui              | IBM Plex Mono (UI) / IBM Plex Sans (body)      |
| Emit toast without auto-dismiss            | Always set `setTimeout(removeToast, 5000)`     |
| Open two modals simultaneously             | Stack modals with `z-index` steps of 100       |

---

## AI Agent Prompt Templates

### Generate a component

```
Using the Primitives design system (dark terminal, IBM Plex Mono, CSS tokens),
generate a [COMPONENT] with:
  - variant: [neutral|success|warning|danger|info|accent]
  - size: [sm|md|lg]
  - state: [default|error|success|disabled|pulse]
  - class pattern: .{component}[-{size}][-{variant}]
Follow the HTML structure in the datasheet. Use only var(--token-name) for colors.
```

### Generate a data table row

```
Add a table row to a .data-table for entity "[NAME]" with:
  - Status: [online|degraded|offline|standby]
  - Row accent: [row-success|row-warning|row-danger]
  - Badge: <span class="t-badge [success|warning|danger|neutral]">
  - Include a .t-check checkbox and a ghost "•••" action button
```

### Generate a toast

```
Call showToast('[info|success|warning|danger]', '[Title]', '[Description]')
Toast auto-dismisses in 5s. Success and info variants include a progress bar.
```

### Condensed token string (paste into any prompt)

```
PRIMITIVES TOKENS:
bg=#0D0F10 surface-1=#121618 surface-2=#171B1E surface-3=#1D2226
border=#252B30 border-bright=#2E363C focus=#3A8CFF
text=#C8D2DA text-sec=#8A9AA8 text-muted=#4E5E6A
success=#3DBA6A warning=#E8A020 danger=#E85050 info=#4A9EE8 accent=#A070E8
font-mono='IBM Plex Mono' font-sans='IBM Plex Sans'
radius: 2px (components) 3px (cards)
transitions: 0.1s colors · 0.15s transforms · 0.22s panels
```