# Design System Audit

Audit of `frontend/admin/src/design-system` and related UI against [design-system.md](./design-system.md) and [design-principles.md](./design-principles.md). Date: 2025-03-04.

---

## Summary

| Category          | Status   | Count |
|-------------------|----------|-------|
| Token / layout    | Fixed    | 3     |
| Typography        | Fixed    | 1     |
| Border radius     | Fixed    | 1     |
| Box-shadow (in-page) | Fixed | 1     |
| Overlay shadows   | Fixed    | tokenized |
| Overlay rgba      | Fixed    | tokenized |
| Hardcoded px      | Partial  | gap/padding where tokens exist |
| Semantic triplet  | Pass     | —     |
| Font (Mono/Sans)  | Pass     | —     |

---

## 1. Violations (must fix)

### 1.1 No box-shadow for in-page elevation

**Principle (design-principles §3):** “No `box-shadow` for elevation within the page. The exception is overlays (modals, drawers, command palette).”

**design-system §2:** “Elevation is communicated through surface-step + border-color change — never `box-shadow`.”

| File | Line | Issue |
|------|------|--------|
| `primitives/primitives.css` | 861 | `.card-elevated { box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08)); }` — in-page card elevation |

**Fix:** Done. `.card-elevated` now uses `--surface-2` + `--border-bright` (surface step + border); no box-shadow.

---

### 1.2 Border radius > 6px / rounded-full

**Principle (design-principles §3):** “Maximum 6px for large containers. No 8px, 12px, 16px, or rounded-full corners.”

| File | Line | Issue |
|------|------|--------|
| `primitives/primitives-dashboard.css` | 339 | KPI chip used `border-radius: 999px` (pill) — exceeds max 6px. |

**Fix:** Replaced with `var(--r-lg)` (6px) to stay within spec. If pill shape is required later, add a documented exception or `--r-pill` token.

---

### 1.3 Font other than Mono / Sans

**Principle (design-principles §3):** “No font other than IBM Plex Mono and IBM Plex Sans under any circumstances.”

| File | Line | Issue |
|------|------|--------|
| `typography/typography.css` | 155 | `.type-serif { font-family: "IBM Plex Serif", serif; }` |

**Fix:** Done. `.type-serif` removed (unused).

---

### 1.4 In-page box-shadow (non-overlay)

**design-system §16 (Anti-patterns):** “box-shadow: 0 4px 12px rgba(0,0,0,.3) for elevation → Surface step + border change.”

| File | Line | Issue |
|------|------|--------|
| `primitives/primitives-extended.css` | 1662, 1808 | `box-shadow: 0 16px 40px rgba(...)` and `0 8px 24px rgba(...)` — confirm these are overlay context (e.g. popover) only; if used for in-page panels, replace with surface + border. |

**Fix:** Confirmed overlay-only (toast, datepicker, popover). All overlay backdrops and panel shadows now use tokens (`--backdrop`, `--backdrop-strong`, `--shadow-overlay*`, `--shadow-drawer-*`).

---

## 2. Token and consistency (should fix)

### 2.1 Overlay / backdrop rgba

**Principle:** Prefer tokens over raw hex/rgba outside `:root`.

**Fix:** Added to `tokens.css`: `--backdrop`, `--backdrop-strong`; `--shadow-overlay`, `--shadow-overlay-sm`, `--shadow-overlay-md`, `--shadow-overlay-lg`, `--shadow-overlay-floating`, `--shadow-overlay-floating-sm`, `--shadow-drawer-r`, `--shadow-drawer-l`. All modal, drawer, toast, popover, datepicker backdrops and panel shadows in `primitives-extended.css` now use these tokens.

---

### 2.2 Hardcoded spacing / font-size

**Principle (design-system §4):** “Never derive values from tokens”; use the spacing and type scales.

**Fix (partial):** In `primitives-extended.css`: gap 8|12|4|16px → var(--sp-2|3|1|4); padding 20px, 16px 20px, 12px 14px, 4px → var(--sp-*). In `primitives-dashboard.css`: gap 4|8px → var(--sp-1|2); padding 8px → var(--sp-2); main padding first value → var(--sp-5). Values not in scale (3, 5, 6, 7, 9, 10, 14, 18, 48px, etc.) left as px.

---

## 3. Compliant areas

- **Semantic triplet:** Badges (`.badge-success`, `.badge-warning`, `.t-badge.*`), alerts, toggles use color + dim fill + border. ✓
- **Tokens in `:root`:** All hex/rgba in `tokens/tokens.css` are in `:root`; no stray hex in token definitions. ✓
- **Font usage:** No Inter/Roboto/system-ui; UI uses `var(--font-mono)`, body/descriptions use `var(--font-sans)`. ✓
- **Focus rings:** Focus states use `var(--focus-ring)` / `var(--bd-focus)` / `var(--focus-glow)` (2px ring), not arbitrary color. ✓
- **Overlay shadows:** Modal, drawer, command palette use strong shadow for float; allowed by spec. ✓
- **Status glows (widgets.css):** `box-shadow: 0 0 8px var(--red)` (and green) on accent/live dots — used as state/liveness signal, not elevation; acceptable but could be documented as “glow for live/degraded state only.”

---

## 4. QA checklist alignment

- **Shell & layout:** Topbar/sidebar dimensions and section headers are in use; no audit of exact px here.
- **Typography:** Single violation (Serif) above; otherwise Mono/Sans and scale respected.
- **Tokens & colors:** Violations limited to card-elevated shadow and overlay rgba; semantic triplet and fill cap respected.
- **Border-radius:** One violation (999px); 2px/3px/50% (dots) otherwise aligned; 50% for circles is a de facto exception for dots/avatars.
- **Components:** DataTable, EmptyState, Badge, KpiValue, skeleton usage consistent with spec.

---

## 5. Recommended next steps

1. **Fix violations:** Remove or replace `.card-elevated` box-shadow; change `border-radius: 999px` to a token or remove; remove or replace `.type-serif`.
2. **Confirm overlay shadows:** Ensure primitives-extended box-shadows at 1662 and 1808 are only on overlay components; if not, switch to surface + border.
3. **Tokenize overlays:** Use `--scrim` and new overlay shadow tokens for modal/drawer/backdrop.
4. **Document exceptions:** If pill radius or dot/avatar circles are kept, add a short “Exceptions” note in design-system.md (e.g. “Pill/chip: 999px or token; dots/avatars: 50%”).
5. **Spacing/type cleanup:** Create a follow-up task to replace hardcoded px in design-system CSS with `--sp-*` and type tokens.

---

*Reference: design-principles.md (Six Core Principles, Visual Language, Token System, Typography, Color); design-system.md (§2 Tokens, §3 Typography, §4 Color, §16 Anti-Patterns, §17 QA & PR Checklist).*
