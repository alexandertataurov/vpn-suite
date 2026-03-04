---
title: Primitives Extended — Technical Specification
version: 2.0.0
type: tech-spec
scope: implementation-reference
system: primitives-design-system
theme: dark-terminal
last_updated: 2026-03-02
components_v1: 11
components_v2: 18
total_components: 29
---

# Primitives Extended — Technical Specification

> Full implementation specification for AI agents, engineers, and design tooling. Covers token architecture, per-component CSS mechanics, interaction patterns, and composition rules.

---

## 1. System Architecture

### 1.1 File Layout

```
primitives.html            # v1 — 11 base components
primitives-extended.html   # v2 — 18 advanced components (includes v1 tokens)

Internal structure of each file:
  <style>
    :root {}               → Design token declarations
    /* component blocks */ → One block per component, prefixed comment header
  </style>
  <body>
    .page                  → Max-width 1120px, centered, padding 56px 48px
    .section               → Per-component demo section
  </body>
  <script>                 → Interaction handlers (tab switching, modals, etc.)
```

### 1.2 Token Architecture

All design decisions are encoded as CSS custom properties on `:root`. Component rules **must** reference tokens — never raw hex values or pixel sizes outside the defined scale.

```css
:root {
  /* Surfaces (5 levels) */
  --bg:              #0d0f10;
  --surface-1:       #121618;
  --surface-2:       #171b1e;
  --surface-3:       #1d2226;
  --surface-4:       #232a2f;

  /* Borders (3 levels + focus) */
  --border-subtle:   #1e2428;
  --border-default:  #252b30;
  --border-bright:   #2e363c;
  --border-focus:    #3a8cff;

  /* Text (4 levels + inverse) */
  --text-primary:    #c8d2da;
  --text-secondary:  #8a9aa8;
  --text-muted:      #4e5e6a;
  --text-disabled:   #313c44;
  --text-inverse:    #0d0f10;

  /* Semantic (6 × 3 tokens each) */
  --interactive:     #3a8cff;
  --interactive-dim: rgba(58,140,255,.08);
  --interactive-border: rgba(58,140,255,.22);
  /* ...same pattern for success, warning, danger, info, accent */

  /* Spacing */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px;
  --sp-5:20px; --sp-6:24px; --sp-8:32px;

  /* Radius */
  --r-sm:2px; --r-md:3px; --r-lg:6px;

  /* Fonts */
  --font-mono: 'IBM Plex Mono', monospace;
  --font-sans: 'IBM Plex Sans', sans-serif;
}
```

### 1.3 Elevation Model

The system uses **border + surface color** for elevation — never `box-shadow` as a depth signal.

| Level | Surface token   | Border token      | Used on                       |
|-------|-----------------|-------------------|-------------------------------|
| 0     | `--bg`          | —                 | Page background                |
| 1     | `--surface-1`   | `--border-subtle` | Inputs, stat cards, tables     |
| 2     | `--surface-2`   | `--border-default`| Dropdowns, tooltips, adornments|
| 3     | `--surface-3`   | `--border-bright` | Modals, command palette        |
| 4     | `--surface-4`   | `--border-bright` | Deep inset elements, cmd icons |

Exception: Modals, drawers, and command palette use `box-shadow` for overlay separation only — not for card-style depth.

---

## 2. Base Components (v1)

### 2.1 Button

**CSS class:** `.btn`
**Required modifier:** size class (`.btn-sm` / `.btn-md` / `.btn-lg`)
**Optional modifier:** variant class (`.btn-{variant}`)

#### Size Dimensions

```css
.btn-sm  { height: 24px; padding: 0 10px; font-size: 9px; }
.btn-md  { height: 30px; padding: 0 14px; font-size: 10px; }
.btn-lg  { height: 38px; padding: 0 18px; font-size: 11px; }
```

#### Variant Tokens

| Variant    | Background              | Border                      | Text color          |
|------------|-------------------------|-----------------------------|---------------------|
| `default`  | `--surface-2`           | `--border-bright`           | `--text-primary`    |
| `primary`  | `--interactive-dim`     | `--interactive-border`      | `--interactive`     |
| `solid`    | `--interactive`         | `--interactive`             | `--text-inverse`    |
| `ghost`    | `transparent`           | `transparent`               | `--text-secondary`  |
| `success`  | `--success-dim`         | `--success-border`          | `--success`         |
| `warning`  | `--warning-dim`         | `--warning-border`          | `--warning`         |
| `danger`   | `--danger-dim`          | `--danger-border`           | `--danger`          |

#### State Transitions

```css
/* All transitions: 0.1s ease */
:hover  → background lightens one surface step, border-color brightens
:active → background darkens one surface step
:disabled → opacity: 0.3; pointer-events: none; cursor: not-allowed
:focus-visible → box-shadow: 0 0 0 2px rgba(58,140,255,.2)
```

#### Icon Sizing

```css
.btn-icon       { width: 10px; height: 10px; opacity: 0.7; }
.btn-icon-only  { width: 30px; /* same as height */ padding: 0; }
.btn-icon-only.btn-sm { width: 24px; height: 24px; }
.btn-icon-only.btn-lg { width: 38px; height: 38px; }
```

---

### 2.2 Input

**CSS class:** `.input`
**State modifiers:** `.is-error` · `.is-success` (note: these are NOT BEM, no `--`)

#### Base Styles

```css
.input {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 7px 10px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.input::placeholder { color: var(--text-muted); }
.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(58,140,255,.12);
}
```

#### State Styles

```css
.input.is-error        { border-color: var(--danger-border); }
.input.is-error:focus  { border-color: var(--danger); box-shadow: 0 0 0 2px var(--danger-dim); }
.input.is-success      { border-color: var(--success-border); }
.input.is-success:focus{ border-color: var(--success); box-shadow: 0 0 0 2px var(--success-dim); }
```

#### Adornment Pattern

Wrap input in `.input-group`. Use `.input-adornment.left` or `.input-adornment.right`:

```css
.input-adornment {
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 0 10px;
}
.input-adornment.left  { border-right: none; border-radius: var(--r-sm) 0 0 var(--r-sm); }
.input-adornment.right { border-left: none;  border-radius: 0 var(--r-sm) var(--r-sm) 0; }
```

---

### 2.3 Checkbox

**CSS class:** `.checkbox-wrap` (on `<label>`)

#### State Mechanism (CSS-only)

```css
input[type="checkbox"]           → border + background from --surface-1
input[type="checkbox"]:hover     → border-color: --border-focus
input[type="checkbox"]:checked   → background: --interactive; border: --interactive
input[type="checkbox"]:checked::after → pseudo-element checkmark (rotate 40deg)
input[type="checkbox"]:indeterminate  → blue border + horizontal bar via ::after
```

**JS required for indeterminate:** `element.indeterminate = true`

---

### 2.4 Toggle

**CSS class:** `.toggle-wrap` (on `<label>`)

#### HTML Structure (required)

```html
<label class="toggle-wrap">
  <input type="checkbox" class="toggle-input">   <!-- hidden, drives state -->
  <span class="toggle-track">
    <span class="toggle-thumb"></span>            <!-- animated thumb -->
  </span>
  <span class="toggle-label">Label</span>
</label>
```

#### State Mechanism

```css
/* Off → On: thumb translates 16px right */
.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(16px);
  background: var(--interactive);
}
/* Track changes */
.toggle-input:checked + .toggle-track {
  background: rgba(58,140,255,.15);
  border-color: var(--interactive);
}
```

Track dimensions: `34px × 18px`. Thumb: `12px × 12px`. Animation: `0.15s ease`.

Variant classes on `.toggle-wrap`:
- `.success` → thumb becomes `--success`, track uses `--success-dim`
- `.danger`  → thumb becomes `--danger`, track uses `--danger-dim`

---

### 2.5 Badge

**CSS class:** `.badge`
**Required modifiers:** size (`.badge-sm/md/lg`) + variant (`.badge-{variant}`)

#### Size Rules

| Class      | Font size | Padding      | Letter spacing |
|------------|-----------|--------------|----------------|
| `.badge-sm`| 9px       | 2px 7px      | 0.09em         |
| `.badge-md`| 10px      | 3px 9px      | 0.07em         |
| `.badge-lg`| 11px      | 4px 11px     | 0.05em         |

#### Pulse Dot

```html
<span class="badge badge-md badge-success">
  <span class="dot pulse"></span>
  Online
</span>
```

```css
@keyframes pulse-badge {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60%  { box-shadow: 0 0 0 4px transparent; opacity: 0.6; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
}
/* Dot inherits color from parent .badge variant */
.dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.dot.pulse { animation: pulse-badge 2s ease infinite; }
```

#### Count Badge

Separate element (not `.badge`):

```css
.badge-count {
  min-width: 18px; height: 18px;
  font-family: var(--font-mono); font-size: 9px; font-weight: 600;
  border-radius: var(--r-sm); border: 1px solid;
  /* Variants: .neutral .danger .success .info */
}
```

---

### 2.6 Progress Bar

```css
.progress-track { height: 3px; background: var(--surface-3); border-radius: 1.5px; }
.progress-bar   { height: 100%; border-radius: 1.5px; transition: width 0.4s ease; }

/* Indeterminate */
.progress-bar.indeterminate {
  width: 40% !important;
  animation: indeterminate 1.4s ease infinite;
}
@keyframes indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

---

## 3. Extended Components (v2)

### 3.1 Tabs

**Variants:** `.tabs-underline` · `.tabs-pill` · `.tabs-bordered`

#### Active State Mechanics

```css
/* Underline: active tab gets a bottom border */
.tabs-underline .tab-btn.active {
  color: var(--interactive);
  border-bottom: 2px solid var(--interactive);
  margin-bottom: -1px; /* overlaps parent border */
}

/* Pill: active tab gets a filled background */
.tabs-pill .tab-btn.active {
  background: var(--surface-3);
  border: 1px solid var(--border-bright);
  color: var(--text-primary);
}

/* Bordered: active tab's bottom border matches panel background */
.tabs-bordered .tab-btn.active {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-bottom-color: var(--surface-1); /* creates connected appearance */
}
```

#### Tab Badge

```css
.tab-badge {
  background: var(--surface-3); border: 1px solid var(--border-bright);
  color: var(--text-muted); /* inactive */
}
.tab-btn.active .tab-badge {
  background: var(--interactive-dim); border-color: var(--interactive-border);
  color: var(--interactive); /* active */
}
```

#### JS Switch Function

```js
function switchTab(btn, panelId) {
  const list  = btn.closest('.tab-list');
  const tabs  = btn.closest('.tabs');
  list.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  tabs.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}
```

---

### 3.2 Accordion

**CSS class:** `.accordion` → `.accordion-item` → `.accordion-trigger` + `.accordion-body`

#### Open/Close Mechanism

Uses `max-height` animation (not `display: none` — enables smooth transition):

```css
.accordion-body          { max-height: 0;    padding: 0 16px;     overflow: hidden; transition: max-height .25s ease, padding .25s ease; }
.accordion-body.open     { max-height: 400px; padding: 14px 16px; }
.accordion-icon          { transition: transform .2s ease; }
.accordion-trigger.active .accordion-icon { transform: rotate(180deg); }
```

> **Limit:** `max-height: 400px` — increase if content exceeds this. CSS height transitions require a fixed max value.

#### JS Toggle (exclusive — only one open at a time)

```js
function toggleAccordion(trigger) {
  const body   = trigger.closest('.accordion-item').querySelector('.accordion-body');
  const isOpen = trigger.classList.contains('active');
  // Close all
  trigger.closest('.accordion').querySelectorAll('.accordion-trigger').forEach(t => t.classList.remove('active'));
  trigger.closest('.accordion').querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
  // Re-open if was closed
  if (!isOpen) { trigger.classList.add('active'); body.classList.add('open'); }
}
```

---

### 3.3 Modal / Dialog

**Backdrop class:** `.modal-backdrop`
**Content class:** `.modal`
**Open state:** add `.open` to `.modal-backdrop`

#### Animation

```css
/* Backdrop fades in */
.modal-backdrop { opacity: 0; transition: opacity .15s; }
.modal-backdrop.open { opacity: 1; }

/* Modal scales and translates in */
.modal { transform: translateY(8px) scale(.98); transition: transform .18s ease; }
.modal-backdrop.open .modal { transform: translateY(0) scale(1); }
```

#### Size Modifiers

| Class        | Width   |
|--------------|---------|
| `.modal-sm`  | 360px   |
| (default)    | 480px   |
| `.modal-lg`  | 640px   |

#### Danger Variant

```css
.modal.modal-danger .modal-header { border-bottom-color: var(--danger-border); }
.modal.modal-danger .modal-title  { color: var(--danger); }
```

#### JS Handlers

```js
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close on backdrop click (prevent event bubbling from .modal)
function closeModalOnBg(e, el) {
  if (e.target === el) el.classList.remove('open');
}
// Usage: <div class="modal-backdrop" onclick="closeModalOnBg(event,this)">
```

---

### 3.4 Dropdown Menu

**Container class:** `.dropdown` (position: relative)
**Menu class:** `.dropdown-menu`
**Open state:** add `.open` to `.dropdown-menu`

#### Animation

```css
.dropdown-menu {
  opacity: 0; transform: translateY(-4px);
  transition: opacity .12s, transform .12s;
}
.dropdown-menu.open { opacity: 1; transform: translateY(0); }
```

#### Close on Outside Click

```js
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown'))
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});
```

#### Item Structure

```html
<button class="dropdown-item [active] [danger]">
  <svg class="item-icon" ...></svg>
  Label
  <span class="item-shortcut">⌘D</span>
</button>
```

---

### 3.5 Command Palette

**Backdrop:** `.cmd-backdrop`
**Panel:** `.cmd-palette`
**Trigger:** `⌘K` (or `Ctrl+K`)

#### Animation

```css
.cmd-palette { transform: scale(.97) translateY(-8px); transition: transform .15s ease; }
.cmd-backdrop.open .cmd-palette { transform: scale(1) translateY(0); }
```

#### Keyboard Handling

```js
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('cmd-palette').classList.add('open');
    document.getElementById('cmd-input').focus();
  }
  if (e.key === 'Escape')
    document.getElementById('cmd-palette').classList.remove('open');
});
```

#### Item Structure

```html
<div class="cmd-item [selected]">
  <div class="cmd-item-icon">⚡</div>
  <div>
    <div class="cmd-item-label">Action label</div>
    <div class="cmd-item-sub">Subtitle or context</div>
  </div>
  <span class="cmd-item-tag">Category</span>
</div>
```

---

### 3.6 Data Table

**Wrapper:** `.data-table-wrap` (handles border + border-radius)
**Table:** `.data-table` (border-collapse: collapse)

#### Row Accent System

Row-level status is communicated via a left border `2px solid`:

```css
.data-table tbody tr.row-success { border-left: 2px solid var(--success); }
.data-table tbody tr.row-warning { border-left: 2px solid var(--warning); }
.data-table tbody tr.row-danger  { border-left: 2px solid var(--danger); }
```

#### Sort State Classes

```css
th.sortable { cursor: pointer; }
th.sort-asc  .sort-icon,
th.sort-desc .sort-icon { opacity: 1; color: var(--interactive); }
```

#### Cell Utility Classes

| Class            | Style                                         |
|------------------|-----------------------------------------------|
| `.cell-primary`  | `color: var(--text-primary)` — main value     |
| `.cell-mono`     | `color: var(--info)` — IDs, codes, versions   |
| `.cell-muted`    | `color: var(--text-muted); font-size: 10px`   |

#### Table Badge Classes

`.t-badge.success` · `.t-badge.warning` · `.t-badge.danger` · `.t-badge.info` · `.t-badge.neutral`

---

### 3.7 Toast / Notification

#### Stack Architecture

```html
<div class="toast-stack" id="toast-stack">
  <!-- Toasts appended here programmatically -->
</div>
```

```css
.toast-stack {
  position: fixed; bottom: 24px; right: 24px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 700; pointer-events: none;
}
.toast { pointer-events: all; } /* re-enable on individual toast */
```

#### Entry/Exit Animation

```css
@keyframes toast-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toast-out {
  to { opacity: 0; transform: translateX(16px); max-height: 0; padding: 0; margin: 0; }
}
.toast          { animation: toast-in .2s ease forwards; }
.toast.removing { animation: toast-out .2s ease forwards; }
```

#### Progress Bar

Auto-dismissal is visualized by a `width: 100% → 0%` animation on `.toast-progress-bar`. Duration matches `setTimeout` (4000–5000ms). Only `success` and `info` variants show the bar — `warning` and `danger` require manual dismiss.

#### Full JS Implementation

```js
const toastIcons = { info:'ℹ', success:'✓', warning:'⚠', danger:'✕' };
let toastId = 0;

function showToast(type, title, desc) {
  const stack = document.getElementById('toast-stack');
  const id = 'toast-' + (++toastId);
  const hasProgress = type === 'success' || type === 'info';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.id = id;
  t.innerHTML = `
    <span class="toast-icon">${toastIcons[type]}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${desc}</div>
    </div>
    <button class="toast-close" onclick="removeToast('${id}')">×</button>
    ${hasProgress ? '<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:4s;"></div></div>' : ''}
  `;
  stack.appendChild(t);
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id) {
  const t = document.getElementById(id);
  if (!t) return;
  t.classList.add('removing');
  setTimeout(() => t.remove(), 200);
}
```

---

### 3.8 Stepper

#### Horizontal Connector Line Mechanism

The line between steps is drawn using `::after` on `.step`:

```css
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 14px;                       /* center of 28px circle */
  left: calc(50% + 18px);          /* starts after circle edge */
  right: calc(-50% + 18px);        /* ends before next circle */
  height: 1px;
  background: var(--border-default);
  z-index: 0;
}
.step.completed:not(:last-child)::after { background: var(--interactive); }
```

#### Step State Classes

| State class    | Circle bg            | Circle border          | Label color         |
|----------------|----------------------|------------------------|---------------------|
| `.pending`     | `--surface-2`        | `--border-default`     | `--text-muted`      |
| `.active`      | `--interactive-dim`  | `--interactive`        | `--interactive`     |
| `.completed`   | `--success-dim`      | `--success-border`     | `--success`         |
| `.error`       | `--danger-dim`       | `--danger-border`      | `--danger`          |

#### Vertical Stepper

Uses `.step-v-track::after` (flex column connector) instead of absolute positioning:

```css
.step-v:not(:last-child) .step-v-track::after {
  content: '';
  flex: 1; width: 1px;
  background: var(--border-default);
  margin-top: 4px;
}
```

---

### 3.9 Drawer

**Backdrop:** `.drawer-backdrop`
**Panel:** `.drawer` (fixed, right edge, full height)
**Open state:** add `.open` to `.drawer-backdrop`

#### Slide Animation

```css
.drawer { transform: translateX(100%); transition: transform .22s cubic-bezier(.22,1,.36,1); }
.drawer-backdrop.open .drawer { transform: translateX(0); }
```

Uses spring-like easing `cubic-bezier(.22, 1, .36, 1)` for a snappy, physical feel.

Default width: `360px`. Increase via override for wider content panels.

---

### 3.10 Date Picker

**Architecture:** custom calendar rendered via JS into `.dp-days` grid (7-column CSS grid).

#### Calendar Render Logic

```js
function renderCalendar() {
  const container  = document.getElementById('dp-days');
  const today      = new Date();
  const first      = new Date(dpDate.getFullYear(), dpDate.getMonth(), 1);
  const startDay   = first.getDay();           // 0=Sunday
  const daysInMonth = new Date(dpDate.getFullYear(), dpDate.getMonth() + 1, 0).getDate();
  const daysInPrev  = new Date(dpDate.getFullYear(), dpDate.getMonth(), 0).getDate();

  // 1. Fill preceding empty cells with prev-month dates (class: other-month)
  // 2. Fill current month dates — add .today, .selected classes as needed
  // 3. Fill trailing cells with next-month dates to complete 7-column rows
}
```

#### Day Button Classes

| Class          | Meaning                                |
|----------------|----------------------------------------|
| `.today`       | Current calendar date                  |
| `.selected`    | User-selected date                     |
| `.other-month` | Prev/next month fill days              |
| `.disabled`    | Out-of-range dates                     |
| `.in-range`    | Range selection (start–end highlight)  |

---

### 3.11 Popover (Rich Tooltip)

**Mechanism:** CSS-only hover — no JS required.

```css
.popover { opacity: 0; transform: translateX(-50%) translateY(4px); transition: opacity .12s, transform .12s; }
.popover-host:hover .popover { opacity: 1; transform: translateX(-50%) translateY(0); }
```

The caret uses layered `::after` and `::before` pseudo-elements — `::after` renders the border triangle in `--border-bright`, `::before` renders the fill triangle in `--surface-3` offset by 1px to cover the border.

---

### 3.12 Avatar Group

Stack effect uses negative left margin + border:

```css
.avatar-group .avatar {
  margin-left: -10px;
  border: 2px solid var(--bg);  /* covers underlying avatar */
}
.avatar-group .avatar:first-child { margin-left: 0; }
```

---

### 3.13 Meter vs Progress — Distinction

| Component        | Track height | Fill style   | Gradient | Use for                          |
|------------------|-------------|--------------|----------|----------------------------------|
| `.progress-bar`  | 3px          | Flat color   | No       | Task completion, loading, uptime |
| `.meter-fill`    | 6px          | `linear-gradient` | Yes | Resource usage, health scores   |
| `.meter-segmented`| 6px         | Individual segments | Partial | Discrete scoring (1–10)      |

---

## 4. Composition Patterns

### 4.1 Status Row

Combine avatar + text + badge + action button:

```html
<div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-subtle);">
  <div class="avatar green" style="position:relative;">
    MK<div class="avatar-status online"></div>
  </div>
  <div>
    <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-primary);">Marina K.</div>
    <div style="font-family:var(--font-sans); font-size:11px; color:var(--text-muted);">Deployed v2.4.1</div>
  </div>
  <span class="badge badge-sm badge-success" style="margin-left:auto;">Active</span>
  <button class="btn btn-sm btn-ghost">•••</button>
</div>
```

### 4.2 Node Card

Combine stat values + meters + badges:

```html
<div style="background:var(--surface-1); border:1px solid var(--border-default); border-radius:var(--r-md); padding:16px;">
  <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
    <span style="font-family:var(--font-mono); font-size:11px; font-weight:600; color:var(--text-primary);">node-prod-01</span>
    <span class="badge badge-sm badge-success"><span class="dot pulse"></span>Online</span>
  </div>
  <div class="meter-wrap">
    <div class="meter-label"><span>CPU</span><span>28%</span></div>
    <div class="meter-track"><div class="meter-fill success" style="width:28%"></div></div>
  </div>
</div>
```

### 4.3 Form Field Group

Label + input + hint, with validation state:

```html
<div class="input-wrap">
  <label class="input-label">API Endpoint <span style="color:var(--danger);">*</span></label>
  <div class="input-group">
    <span class="input-adornment left">https://</span>
    <input type="text" class="input is-success" value="api.yourapp.io">
  </div>
  <span class="input-hint is-success">Reachable — 142ms response time</span>
</div>
```

### 4.4 Confirmation Modal with Typed Input

Pattern for destructive actions requiring the user to type a name to confirm:

```html
<div class="modal-body">
  <p style="color:var(--danger); margin-bottom:12px;">This action is permanent.</p>
  <p style="margin-bottom:16px;">
    To confirm, type <code style="font-family:var(--font-mono); color:var(--info); background:var(--surface-3); border:1px solid var(--border-default); padding:1px 5px; border-radius:2px;">resource-name</code>
  </p>
  <label class="input-label">Confirm name</label>
  <input class="input" placeholder="resource-name" oninput="validateConfirm(this)">
</div>
<div class="modal-footer">
  <button class="btn btn-ghost">Cancel</button>
  <button class="btn btn-danger" id="confirm-btn" disabled>Delete</button>
</div>
```

```js
function validateConfirm(input) {
  document.getElementById('confirm-btn').disabled = input.value !== 'resource-name';
}
```

### 4.5 Deployment Pipeline (Stepper + Timeline)

Use stepper for current pipeline state, timeline for historical events:

```html
<!-- Current state -->
<div class="stepper"> ... steps ... </div>

<!-- Event history (below the stepper) -->
<div style="margin-top:32px; border-top:1px solid var(--border-subtle); padding-top:20px;">
  <div class="timeline"> ... events ... </div>
</div>
```

### 4.6 Widget / KPI Card

Widgets are composed containers built from `.card` + layout utilities. They are used for overview dashboards and telemetry summaries.

**Root classes**

```html
<div class="card widget">...</div>           <!-- generic widget -->
<div class="card widget kpi">...</div>       <!-- KPI-focused widget -->
```

**Header layout**

```html
<div class="widget__header">
  <div>
    <h3 class="widget__title type-h4">Title</h3>
    <p class="widget__subtitle type-body-xs">Subtitle / timeframe</p>
  </div>
  <!-- Optional right-aligned content */}
  <span><!-- KpiDelta, badge, etc. --></span>
</div>
```

**KPI body**

```html
<div class="kpi__value">42</div>
<div class="kpi__meta">
  <span class="kpi__meta-item">meta A</span>
  <span class="kpi__meta-item">meta B</span>
</div>
```

React primitive (admin app):

- `Widget` component wraps this structure using `Card`, `CardTitle`, `Caption`, and `KpiValue`.
- Props: `title`, `subtitle?`, `variant?: "default" | "kpi"`, `headerRight?`, `children`.
- Renders: `<Card class="widget [kpi] [className]">…</Card>`.

---

## 5. z-index Stack

| Layer              | z-index | Component                    |
|--------------------|---------|------------------------------|
| Base content       | 0       | All standard components      |
| Dropdowns, popovers| 100–200 | `.dropdown-menu`, `.popover` |
| Drawers            | 400–401 | `.drawer-backdrop`, `.drawer`|
| Modals             | 500     | `.modal-backdrop`            |
| Command palette    | 600     | `.cmd-backdrop`              |
| Toasts             | 700     | `.toast-stack`               |

> Rule: Each overlay layer must be separated by at least 100 z-index units to allow nested overlays.

---

## 6. Transition Timing Reference

| Component      | Property              | Duration | Easing                         |
|----------------|-----------------------|----------|--------------------------------|
| Button         | background, border    | 0.1s     | `ease`                         |
| Input          | border-color, shadow  | 0.12s    | `ease`                         |
| Toggle thumb   | transform             | 0.15s    | `ease`                         |
| Toggle track   | background, border    | 0.15s    | `ease`                         |
| Accordion body | max-height, padding   | 0.25s    | `ease`                         |
| Accordion icon | transform (rotate)    | 0.2s     | `ease`                         |
| Badge pulse    | box-shadow            | 2s       | `ease` (infinite)              |
| Progress bar   | width                 | 0.4s     | `ease`                         |
| Skeleton       | background-position   | 1.6s     | `ease` (infinite)              |
| Dropdown       | opacity, transform    | 0.12s    | `ease`                         |
| Popover        | opacity, transform    | 0.12s    | `ease`                         |
| Datepicker     | opacity, transform    | 0.12s    | `ease`                         |
| Modal          | transform, scale      | 0.18s    | `ease`                         |
| Modal backdrop | opacity               | 0.15s    | `ease`                         |
| Toast in       | opacity, transform    | 0.2s     | `ease`                         |
| Toast out      | opacity, transform    | 0.2s     | `ease`                         |
| Drawer         | transform             | 0.22s    | `cubic-bezier(.22, 1, .36, 1)` |
| Command palette| transform, scale      | 0.15s    | `ease`                         |
| Tab panel      | (instant)             | —        | `display` toggle, no animation |

---

## 7. Constraint Reference

### Hard Limits

| Constraint                       | Value | Reason                                     |
|----------------------------------|-------|--------------------------------------------|
| Max border-radius (component)    | 2px   | System uses `--r-sm`                       |
| Max border-radius (card/overlay) | 3px   | System uses `--r-md`                       |
| Max semantic fill opacity        | 8%    | Preserves dark background legibility       |
| Semantic border opacity          | 22%   | Visible without overwhelming               |
| Min touch target                 | 24px  | Smallest button height (`.btn-sm`)         |
| Accordion max-height             | 400px | CSS transition requires fixed value        |
| Drawer default width             | 360px | Adjust per content requirements            |
| Toast max-width                  | 380px | Prevents full-width on mobile              |
| Modal default width              | 480px | `.modal-sm`: 360px · `.modal-lg`: 640px    |
| Command palette width            | 540px | Optimal for dense content + search         |

### Prohibited Patterns

```
✗ color: #3DBA6A           → color: var(--success)
✗ background: white        → dark-only system, no light surfaces
✗ border-radius: 8px       → max 2px (components), 3px (cards)
✗ font-family: Inter       → IBM Plex Mono (UI) or IBM Plex Sans (body)
✗ box-shadow for elevation → use surface color progression
✗ background opacity > 10% → use --{variant}-dim tokens (8%)
✗ Two modals open at once  → use z-index stacking + separate backdrop IDs
✗ Warning/danger toast auto-dismiss → require manual user dismissal
```

---

## 8. AI Agent Context Blocks

### Minimal Token Context (paste into prompt)

```
PRIMITIVES v2 TOKENS:
bg=#0D0F10 s1=#121618 s2=#171B1E s3=#1D2226 s4=#232A2F
border=#252B30 border-bright=#2E363C focus=#3A8CFF
text=#C8D2DA text-sec=#8A9AA8 muted=#4E5E6A disabled=#313C44
interactive=#3A8CFF success=#3DBA6A warning=#E8A020
danger=#E85050 info=#4A9EE8 accent=#A070E8
font-mono='IBM Plex Mono' font-sans='IBM Plex Sans'
r-sm=2px r-md=3px
sp: 4/8/12/16/20/24/32px
transitions: 0.1s colors · 0.15s transforms · 0.22s panels
z-index: dropdown=200 drawer=401 modal=500 cmd=600 toast=700
```

### Component Generation Prompt

```
Generate a [COMPONENT] using the Primitives v2 design system:
- Theme: dark terminal, IBM Plex Mono (UI), IBM Plex Sans (body)
- Variant: [neutral|success|warning|danger|info|accent]
- Size: [sm|md|lg]
- State: [default|hover|error|success|disabled|pulse|active|pending|completed]
- Use class pattern: .{component}[-{size}][-{variant}]
- Use var(--token) for all colors, never hardcode hex
- Border-radius: 2px (components), 3px (cards/overlays)
```

### Overlay Component Prompt

```
Generate a [modal|drawer|dropdown|command-palette|datepicker] overlay:
- Backdrop: rgba(5,6,8,.8) + backdrop-filter: blur(2px)
- Panel: var(--surface-2/3), border: 1px solid var(--border-bright)
- Box-shadow: 0 24px 64px rgba(0,0,0,.6)
- Open animation: opacity 0→1 + transform (translateY or scale)
- Close on backdrop click (check e.target === backdrop element)
- z-index: modal=500, drawer=401, dropdown=200, cmd=600
```

### Table Row Generation Prompt

```
Generate a data table row for [ENTITY] with:
- Row class: row-[success|warning|danger] (adds left accent border)
- Checkbox: <input type="checkbox" class="t-check">
- Status: <span class="t-badge [success|warning|danger|info|neutral]">
- ID/code cells: class="cell-mono" (IBM Plex Mono, --info color)
- Primary label: class="cell-primary" (--text-primary)
- Metadata: class="cell-muted" (10px, --text-muted)
- Action: <button class="btn btn-sm btn-ghost">•••</button>
```