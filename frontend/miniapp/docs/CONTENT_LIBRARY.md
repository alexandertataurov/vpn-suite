# VPN Suite · Content Library

> **Scope:** Scrollable page content only — everything inside `.page`. Topbar, bottom nav, shell boilerplate, token `:root`, CSS reset, animation keyframes, and JS utilities live in the **main design system**, which must be loaded first.
>
> **How to use:** Pick a page from Section 1 to understand composition intent, then assemble from the component library in Sections 2–12. Every component is self-contained — HTML + CSS + variants + state rules in one block.

---

## 0 · Page Composition Model

Every page follows this exact structure inside `.page`:

```
[Page Header]         — always first. Title + optional right-side badge.
[Hero Block]          — one per page. The dominant card for this page's primary purpose.
[Section Divider]     — labels a group of cards below it.
  [Content Cards]     — 1–N cards per section.
[Section Divider]
  [Content Cards]
...
```

`.page` handles gap (`8px`) and padding. Never add margin to the top or bottom of cards — let the flex gap do it.

**Stagger rule:** Each element in the page gets a `fadeup` entrance animation. Delays increment by `+0.04s` per element in visual order, starting at `0s` for the Page Header. Use `animation: fadeup .4s <delay> cubic-bezier(.22,1,.36,1) both`. Use class `.stagger-0`, `.stagger-1`, … `.stagger-n` (delay = n × 0.04s) or set `animationDelay` from index in JS.

---

## 1 · Page Map

| Page | Route | Nav active | Hero | Sections |
|------|--------|------------|------|----------|
| Home | `/` | Home | Connection Status Card | *(no label)* Connection data + button row; Quick Access operation rows |
| Devices | `/devices` | Devices | Device count summary (N active / N total, health bar) | Active Devices list rows; Add Device CTA |
| Plan | `/plan` | Plan | Active Plan Card | Available Plans (toggle + tier cards); Usage progress rows; Billing History list + footer |
| Support | `/support` | Support | Status card (issue or "All clear") | Quick Help rows; Diagnostics metric strip; Recent Tickets list |
| Account | `/account` | Account | Account summary card | Profile form; Preferences toggles; Session operation rows |

---

## 2 · Page Header

First element on every page. Class: `.page-hd`. Title: `.page-title` (optional `<span>` for muted accent). Right slot: `.page-hd-badge` (variants `.g`, `.b`, `.a`, `.r`) or `.page-hd-btn`.

---

## 3 · Hero Cards

One per page. Largest card. Ambient glow + colored left edge accent.

- **3a Connection Status Hero** — State-driven: `inactive` | `connecting` | `connected`. Class `.conn-card`; state classes `s-connecting`, `s-connected`. Glow `.card-glow` with `.g-red`, `.g-amber`, `.g-green`. Update all elements per state table (title, hint, button label/class, data cells).
- **3b Plan Hero** — `.plan-hero`, `.plan-hero-glow`, `.plan-hero-body`; expiry bar; optional `.expiring` / `.expired`.
- **3c Account Summary Hero** — `.acct-hero`, `.acct-avatar`, `.acct-info`, `.acct-name`, `.acct-email`, `.acct-since`, `.acct-status`.
- **3d Generic Summary Hero** — `.summary-hero` with edge variant `.e-g` / `.e-b` / `.e-a` / `.e-r`; `.summary-hero-glow` (`.g-green`, `.g-blue`, etc.); `.card-eyebrow`, `.summary-hero-title`, `.summary-hero-sub`.

---

## 4 · Section Divider

`.shead` — `.shead-lbl`, `.shead-rule`, optional `.shead-count`.

---

## 5 · Data Cell Grid

`.data-grid` (default 2-col); `.data-grid.wide` (1-col); `.data-grid.three` (3-col). Cells: `.data-cell`, `.dc-key`, `.dc-val` (value tones: `.teal`, `.green`, `.amber`, `.red`, `.mut`, `.ip`).

---

## 6 · Operation Row

`.op` with edge tone `.e-g` / `.e-b` / `.e-a` / `.e-r`. Min height 70px. `.op-ico` (`.g`, `.b`, `.a`, `.r`), `.op-body`, `.op-name`, `.op-desc`, `.op-chev`. Container: `.ops`.

---

## 7 · Metric Tile Strip

`.metrics` — grid 3 cols. `.m-tile`, `.m-key`, `.m-val` (`.g`, `.b`, `.a`, `.r`, `.w`), `.m-unit`, `.m-sub`.

---

## 8 · Progress Bar

`.expiry-row`, `.expiry-meta`, `.expiry-lbl`, `.expiry-val`, `.bar-track`, `.bar-fill` (`.ok`, `.warn`, `.crit`, `.info`). **Always** animate fill on load with `setTimeout` ≥ 380ms.

---

## 9 · List Row

`.list-card`, `.list-card-title`. Rows: `.list-row`, `.lr-ico` (`.g`, `.b`, `.a`, `.r`, `.n`), `.lr-body`, `.lr-title`, `.lr-sub`, `.lr-right`, `.lr-amount`, status chip. Border between rows: `border-top: 1px solid var(--bd-sub)`.

---

## 10 · Status Chip

`.status-chip` with variants: `.paid`, `.pend`, `.active`, `.info`, `.offline`.

---

## 11 · Buttons

`.btn-primary` (variants: `.danger`, `.warning`, `.success`); `.btn-secondary`. Layouts: `.btn-row` (1fr 1fr), `.btn-row-auto` (1fr auto).

---

## 12 · Form & Settings

`.field-group`, `.field-label`, `.field-wrap`, `.field-input`, `.field-action`. `.settings-card`, `.settings-divider`. `.toggle-setting`, `.ts-body`, `.ts-name`, `.ts-desc`, `.ts-toggle` (`.on`), `.ts-knob`. `.seg-toggle`, `.seg-btn` (`.on`), `.seg-tag`.

---

## 13 · Card Footer Link

`.card-footer-link` — full-width "see all" row; `position: relative; overflow: hidden` for ripple.

---

## 14 · Eyebrow Label

`.card-eyebrow` — mono, uppercase, tracked.

---

## 15 · Notification Badge

`.notif-badge` on `.icon-btn`; `.hidden` to hide.

---

## 16 · Tier Card

`.tier-card` (`.selected`, `.featured`); `.tier-badge`; `.tier-body`, `.tier-top`, `.tier-info`, `.tier-name`, `.tier-desc`, `.tier-pricing`, `.tier-price`, `.tier-period`, `.tier-features`, `.feat-row`, `.feat-ico` (`.yes`, `.no`), `.feat-text`, `.feat-val`, `.tier-select-btn`. Selected/featured: update border, `::before`, and `.tier-select-btn` together.

---

## 17 · Shared Utilities

`.status-dot` (`.online`, `.connecting`). `.icon-btn`. Tap-to-copy: use `navigator.clipboard` and temporary "copied" feedback.

---

## 18 · Content-Level Constraints

- Do not use `--ui` font for data cell values (use `--mono`).
- Do not use non-semantic colors for `.dc-val` (only semantic tokens or `--tx-pri`/`--tx-sec`/`--tx-mut`).
- Status chip must set color + background + border (full triplet).
- Tier card selected state must update border, `::before`, and `.tier-select-btn` together.
- Billing toggle must update price, strikethrough, and period label together.
- Progress bar width must be set after DOM load with `setTimeout` ≥ 380ms.
- Progress bar fill class must match the label/count color class.
- Operation row min height 70px; toggle row min height 64px; `.tier-select-btn` min height 44px.
- List rows must have `border-top: 1px solid var(--bd-sub)` between items.
- Card footer link must have `position: relative` and `overflow: hidden`.
- Eyebrow label: `--mono`, uppercase, letter-spacing. Metric `.m-val`: `--mono`.
- Hero is always first content after page header. Section divider must have a label when used.
- Page header must have fadeup on first load. Connection state change must update every row in the state table.
