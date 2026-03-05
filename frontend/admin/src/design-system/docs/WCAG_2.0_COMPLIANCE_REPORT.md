# WCAG 2.0 AA Compliance Report — Admin

**Reference:** [WCAG_2.0.md](./WCAG_2.0.md), [design-system.md §13](design-system.md#13-accessibility), W3C How to Meet WCAG (Context7).

**Scope:** `frontend/admin` (design-system primitives, widgets, layout, feature pages).

**Target:** Level AA.

**Last reviewed:** 2025-03-05 (code audit + 3.3.3/3.3.4 remediation).

**Coverage:** This report addresses 100% of [WCAG_2.0.md](./WCAG_2.0.md): all success criteria (1.1.1–4.1.2), AAA/out-of-scope callouts, Engineering Implementation Rules (Must Pass, Required Testing, Design System Rules table), and the full "UI Accessibility Design Rules" section (1–12 + Production Rule).

---

## 1. Perceivable

### 1.1 Text Alternatives

| Criterion | Status | Notes |
|-----------|--------|--------|
| **1.1.1 Non-text Content (A)** | Pass | No `<img>` in app src; icons use `aria-label`. OverviewCharts plot divs have `aria-label` (e.g. "Peers timeseries chart", "Bandwidth timeseries chart"). TelemetryWidget sparkline wrapper has `role="img"` and `aria-label`. VpnNodeSparkline has `role="img"` and `aria-label={title ?? "Sparkline"}` with `<title>` when title provided. |

### 1.2 Time-based Media

| Criterion | Status | Notes |
|-----------|--------|--------|
| **1.2.1 Audio-only/Video-only (Prerecorded) (A)** | N/A | No audio-only or video-only content. |
| **1.2.2 Captions (Prerecorded) (A)** | N/A | No prerecorded video. |
| **1.2.3 Audio Description (Prerecorded) (A)** | N/A | No prerecorded video. |
| **1.2.4 Captions (Live) (AA)** | N/A | No live video. |
| **1.2.5 Audio Description (AA)** | N/A | No prerecorded video. |
| **1.2 AAA** (sign language, extended audio desc, full text alt) | Out of scope | AAA level; not required for AA. |

### 1.3 Adaptable

| Criterion | Status | Notes |
|-----------|--------|--------|
| **1.3.1 Info and Relationships (A)** | Pass | Semantic HTML: `<main>`, `<nav>`, `<section>`, `<h1>`–`<h3>`, `<label>`, `<th scope="col">`. Headings and landmarks used in layout and pages. |
| **1.3.2 Meaningful Sequence (A)** | Pass | DOM order reflects reading order; no major reordering that would confuse AT. |
| **1.3.3 Sensory Characteristics (A)** | Pass | Instructions do not rely solely on color or shape. |

### 1.4 Distinguishable

| Criterion | Status | Notes |
|-----------|--------|--------|
| **1.4.1 Use of Color (A)** | Pass | Errors use text + icon + color (e.g. Login error, Input error state). Status uses badge text + color. |
| **1.4.2 Audio Control (A)** | N/A | No auto-playing audio. |
| **1.4.3 Contrast Minimum (AA)** | Pass | design-system §13 documents token contrast (e.g. `--tx-pri` on `--s1` ~9:1, `--tx-sec` ~4.8:1). Tokens chosen for AA. |
| **1.4.4 Resize Text (AA)** | Pass | No fixed px font sizes that prevent 200% zoom; relative units and tokens. |
| **1.4.5 Images of Text (AA)** | Pass | No images of text used for content. |
| **1.4 AAA** (enhanced contrast, adjustable audio, customizable layout) | Out of scope | AAA level; not required for AA. |

---

## 2. Operable

### 2.1 Keyboard Accessible

| Criterion | Status | Notes |
|-----------|--------|--------|
| **2.1.1 Keyboard (A)** | Pass | All functionality keyboard operable. Modal and Drawer trap focus (Tab cycles inside; Escape closes and restores focus). |
| **2.1.2 No Keyboard Trap (A)** | Pass | Focus trap in Modal/Drawer keeps focus inside until close; focus is restored to previous active element on close. |
| **2.1.3 Keyboard (AAA)** | Out of scope | AAA level; 2.1.1/2.1.2 cover AA. |

### 2.2 Enough Time

| Criterion | Status | Notes |
|-----------|--------|--------|
| **2.2.1 Timing Adjustable (A)** | Pass | No time limits on content; no session timeouts that cannot be extended in-app. |
| **2.2.2 Pause/Stop/Hide (A)** | Pass | Auto-dismiss toasts configurable (persistent for warning/danger). Moving content (e.g. live chip) minimal; no carousels that auto-advance without pause. |

### 2.3 Seizures

| Criterion | Status | Notes |
|-----------|--------|--------|
| **2.3.1 Three Flashes (A)** | Pass | No content flashes more than 3 per second. |

### 2.4 Navigable

| Criterion | Status | Notes |
|-----------|--------|--------|
| **2.4.1 Bypass Blocks (A)** | Pass | Skip link in [DashboardShell](src/layout/DashboardShell.tsx): `<a href="#main-content" className="skip-link">Skip to main content</a>`, target `<main id="main-content">`. Styled visible on focus (shell.css). |
| **2.4.2 Page Titled (A)** | Pass | [DocumentTitle](src/app/router.tsx) sets `document.title` per route (e.g. "Servers — VPN Suite Admin"). |
| **2.4.3 Focus Order (A)** | Pass | Logical tab order (skip link, topbar, sidebar, main). |
| **2.4.4 Link Purpose (A)** | Pass | Links use descriptive text or `aria-label` (e.g. SidebarNav `aria-label={label}`). |
| **2.4.5 Multiple Ways (AA)** | Pass | Nav menu + breadcrumb/crumb; command palette for power users. |
| **2.4.6 Headings and Labels (AA)** | Pass | Section headings and form labels in place; PageLayout/SectionHeader patterns. |
| **2.4.7 Focus Visible (AA)** | Pass | `:focus-visible` used in primitives and shell CSS (outline/box-shadow). |

---

## 3. Understandable

### 3.1 Readable

| Criterion | Status | Notes |
|-----------|--------|--------|
| **3.1.1 Language of Page (A)** | Pass | [index.html](index.html): `<html lang="en">`. |
| **3.1.2 Language of Parts (AA)** | N/A | No in-page language changes. |

### 3.2 Predictable

| Criterion | Status | Notes |
|-----------|--------|--------|
| **3.2.1 On Focus (A)** | Pass | No focus-triggered unexpected actions. |
| **3.2.2 On Input (A)** | Pass | Form input changes do not auto-submit or navigate. |
| **3.2.3 Consistent Navigation (AA)** | Pass | Sidebar/topbar consistent across pages. |
| **3.2.4 Consistent Identification (AA)** | Pass | Same components (e.g. Refresh, Settings) labeled consistently. |

### 3.3 Input Assistance

| Criterion | Status | Notes |
|-----------|--------|--------|
| **3.3.1 Error Identification (A)** | Pass | Errors shown in text (e.g. Login `role="alert"`); Input `aria-invalid`. |
| **3.3.2 Labels or Instructions (A)** | Pass | Login uses `<label htmlFor="...">`; Input supports `describedById` and `aria-describedby`. Login error has `id="login-error"` and both inputs use `describedById="login-error"` when error is shown. |
| **3.3.3 Error Suggestion (AA)** | Pass | Login: error message includes "Check your email and password, then try again." Settings alert email: "Invalid format — expected something like ops@domain.io". Create server: "Name, region, and API endpoint are required." |
| **3.3.4 Error Prevention (AA)** | Pass | User delete: Modal with type DELETE to confirm. Device revoke: Modal with confirmation token. Server delete: Modal with type DELETE to confirm (added 2025-03-05). |

---

## 4. Robust

### 4.1 Compatible

| Criterion | Status | Notes |
|-----------|--------|--------|
| **4.1.1 Parsing (A)** | Pass | React output is valid HTML; no duplicate IDs (useId() where needed). |
| **4.1.2 Name, Role, Value (A)** | Pass | Custom controls use ARIA (Modal, Drawer, Tabs, Accordion, CommandPalette listbox/option, Meter, Toast role/alert/status, Progress, TableCell scope). Icon-only buttons use `aria-label`. design-system §13 table and QA checklist enforced. |

---

## UI Accessibility Design Rules (WCAG_2.0.md § Practical Implementation)

Maps to **WCAG_2.0.md** “UI Accessibility Design Rules” section (typography, contrast, focus, targets, spacing, motion, forms, layout, icons, charts, contracts, testing). Verified against `frontend/admin` (tokens, primitives, shell, typography CSS).

| Rule | Status | Notes |
|------|--------|--------|
| **1) Typography** (min font sizes, line height, max line length) | Pass | Body uses `--text-lg` (16px) in primitives.css; line-height 1.5; tokens and rem aliases; caption/UI ≥12px. |
| **2) Color contrast** (text 4.5:1 / 3:1, UI 3:1, disabled ≥3:1, error/success not color alone) | Pass | design-system §13; tokens increased: --tx-pri, --tx-sec, --tx-mut, --text-disabled for higher contrast on surfaces; errors use icon + text + color. |
| **3) Focus visibility** (`:focus-visible`, never remove outlines, visible on all controls) | Pass | primitives and shell CSS use `:focus-visible`; outline/box-shadow. |
| **4) Click/touch targets** (44×44px primary, 40×40 icon, 32px min height links) | Pass | primitives.css: .btn-md 44px, .btn-lg 48px, .btn-sm 32px; .btn-icon-only 40px (44px lg); shell.css: .nav-a min-height 32px. |
| **5) Spacing resilience** (line-height 1.5, paragraph 2× font, letter/word spacing overrides) | Pass | No hard-coded clipping; layout uses flex/grid; content reflows. |
| **6) Motion & animation** (no flash 2.3.1; `prefers-reduced-motion`) | Pass | No flashing (2.3.1). `@media (prefers-reduced-motion: reduce)` in primitives.css shortens transitions/animations to 0.01ms; scroll-behavior: auto. |
| **7) Forms** (visible label, helper text, `aria-describedby` errors, error prevention for critical) | Pass | Input/Login/Settings use labels and describedById; critical actions have confirmation (3.3.4). |
| **8) Layout (zoom & reflow)** (200% zoom usable, no horizontal scroll primary content) | Pass | Relative units; 1.4.4 resize text satisfied; layouts reflow. |
| **9) Icon accessibility** (interactive: aria-label or text; decorative: aria-hidden, not focusable) | Pass | Icon-only buttons use `aria-label`; decorative icons not focusable. |
| **10) Charts & data viz** (text summary, table/download recommended) | Pass | Charts have `role="img"` and `aria-label`; tooltips/summaries where present. |
| **11) Contracts & long-form** (readability, headings/TOC, sticky accept accessible) | N/A | No contracts/legal long-form in admin scope. |
| **12) Testing & CI** (keyboard, screen reader, 200% zoom, focus visible; axe, Lighthouse ≥90) | Pass | CI runs Lighthouse a11y; manual checklist in design-system §13. |
| **Production rule** (accessibility in design system by default) | Pass | Primitives enforce keyboard, focus, name/role/value, forms; design-system §13. |

**Fixes applied (rules 1, 4, 6, contrast):** (1) Body font-size set to `var(--text-lg)` (16px) in primitives.css. (4) Button heights: .btn-md 44px, .btn-lg 48px, .btn-sm 32px; .btn-icon-only 40px (44px lg); .nav-a min-height 32px. (6) `@media (prefers-reduced-motion: reduce)` added in primitives.css. Contrast: --tx-pri, --tx-sec, --tx-mut, --text-disabled lightened in tokens.css for higher contrast on dark surfaces.

---

## Engineering Rules (from WCAG_2.0.md)

Must Pass + Design System Rules table (WCAG_2.0.md):

| Rule | Status |
|------|--------|
| Keyboard navigation | Pass |
| Visible focus | Pass |
| ARIA roles where necessary | Pass |
| Semantic HTML | Pass |
| **Design System Rules table** (Buttons, Forms, Navigation, Icons, Charts) | Pass | Buttons/keyboard; Forms labels+errors; Nav focus order; Icons accessible names; Charts textual descriptions — see §§1–4 and UI Accessibility Design Rules above. |

---

## Fixes Applied

1. **Charts (1.1.1):** OverviewCharts plot divs already had `aria-label`. TelemetryWidget sparkline wrapper now has `role="img"` and `aria-label`. VpnNodeSparkline has `role="img"` and `aria-label={title ?? "Sparkline"}`.
2. **Modal/Drawer (2.1.1 / 2.1.2):** Focus trap implemented: Tab/Shift+Tab cycle within dialog, Escape closes and restores focus to previous active element.
3. **Login (3.3.2):** Error message has `id="login-error"`; both inputs use `describedById="login-error"` when error is set.
4. **VpnNodeSparkline:** Accessible name via `aria-label` (title or "Sparkline"); `<title>` retained when title provided.
5. **3.3.3 Error Suggestion:** Login error text now includes suggestion "Check your email and password, then try again." (Settings and Create server already had suggestion text.)
6. **3.3.4 Error Prevention:** Server delete now uses a confirmation Modal (type DELETE to confirm); Users and Devices already had confirmation.
7. **UI Design Rules 1, 4, 6:** Body font-size 16px (--text-lg); button/nav touch targets ≥44/40/32px; `@media (prefers-reduced-motion: reduce)` in primitives.css.
8. **Contrast:** tokens.css — --tx-pri, --tx-sec, --tx-mut, --text-disabled lightened for higher contrast on dark surfaces.

---

## Testing

Aligns with **WCAG_2.0.md** “Required Accessibility Testing” and “Recommended Accessibility Workflow” (design → dev → automated audit → manual → CI):

- **CI:** Lighthouse accessibility run in [.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) with score threshold (e.g. ≥0.9). Requires Chrome (Playwright Chromium in CI).
- **Local:** Build admin, serve from `.serve/admin` at port 4173, then `npx lighthouse http://127.0.0.1:4173/admin/ --only-categories=accessibility` (Chrome required). axe DevTools, keyboard-only, NVDA/VoiceOver for manual checks.
- **Design-system §13:** Required accessibility testing and design system rules table documented.

---

*Report generated against WCAG 2.0 and project [WCAG_2.0.md](./WCAG_2.0.md). Context7 used for W3C “How to Meet WCAG” techniques (bypass blocks, page titled, name/role/value, labels).*
