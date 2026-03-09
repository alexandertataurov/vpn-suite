# Design System Refactor Roadmap

Status: Phases 1–2 complete; Phases 3–5 planned/partial. See audit plan for full context.

---

## Phase 1 — Critical stabilization ✅

**Done.** Card re-export removed; raw buttons replaced with Button/ButtonRow; all page `btn-row` migrated to ButtonRow; ThemeProvider barrel import; Toast `role="status"` `aria-live="polite"`; README Mission* vs Button docs.

---

## Phase 2 — Architectural cleanup ✅

**Done.** Product patterns moved to `src/components/`; design-system patterns cleaned; imports updated.

**Tasks completed:**
- `src/components/heroes/` — PlanHero, ConnectionStatusHero, AccountSummaryHero, SummaryHero
- `src/components/cards/` — TierCard, UsageSummaryCard, BillingHistoryCard
- `src/components/` — DangerZone, LimitStrip, TroubleshooterStep, SessionMissing
- Removed these from design-system patterns; all consumers import from `@/components`
- README updated with boundary documentation

---

## Phase 3 — Token and variant consolidation ✅ Partial

**Done:** `design:check` (including `token:drift`) added to main CI in `.github/workflows/ci.yml`.

**Remaining tasks:**
- Run `npm run token:drift` in CI
- Consolidate spacing to single scale (0,1,2,3,4,5,6,8,10,12)
- Consolidate typography to page-title, section-title, card-title, body, caption, label
- Deprecate `data-theme="primitives"` for miniapp (use consumer-dark/consumer-light only)
- Add token build script (JSON/TS → CSS) to eliminate hand-edited duplication

**Impact:** Predictable theming; less drift.

**Risk:** Medium (visual regressions).

---

## Phase 4 — Accessibility and mobile hardening ✅ Partial

**Done:** Modal focus first focusable; overlay `role="presentation"` `aria-hidden="true"`; PlanHero Plan ID keyboard handler and aria-label; `jsx-a11y/control-has-associated-label` lint rule (warn); touch target audit documented in mobile-platform-guidelines.

**Remaining:**
- Full `inert` on non-dialog content (requires structural change)
- Full `aria-label` coverage (control-has-associated-label surfaces gaps)
- Add safe-area tests

---

## Phase 5 — Visual consistency polish ✅ Partial

**Done:** Content-library magic numbers partially replaced with tokens (spacing-1/2/3/4/5, size-touch-target, ds-font-page-title-size; card-body, plan-hero-body, op-meta padding).

**Remaining:**
- Continue replacing magic numbers in content-library.css
- Consolidate radius definitions across themes

---

## Long-term recommendations

1. **Single token pipeline** — Tokens in JSON/TS → build script → CSS. No hand-edited duplication.
2. **Strict layer boundaries** — Primitives → Components → Patterns → App (heroes, cards).
3. **Telegram-first** — Optimize for consumer-dark/consumer-light; treat others as legacy.
4. **Storybook** — Cover all primitives and components; use for token/theme docs.
5. **Lint rules** — No raw `btn-*`; no hardcoded colors/spacing; enforce `aria-label` on icon-only.
6. **Design-system package** — Consider `@vpn-suite/miniapp-design-system` for versioning and reuse.

---

## Extra analysis (from audit)

**What is good:** Layered architecture, ThemeProvider + TelegramThemeBridge, Field/Label/HelperText composition, Mission* variant system, content-library structure, mobile-platform-guidelines.

**What pretends to be reusable but is not:** PlanHero, ConnectionStatusHero, AccountSummaryHero, TierCard, UsageSummaryCard, BillingHistoryCard, DangerZone, LimitStrip, TroubleshooterStep, SessionMissing.

**What is missing:** SegmentedControl/ToggleRow as first-class component, bottom sheet primitive, skeleton variants, form validation styling contract, slot-based Card.

**Biggest UI inconsistency sources:** Dual btn-* vs Button/ButtonRow (partially fixed), radius/shadow differing by theme, Mission*Link/Anchor using raw classes.

**Expensive in 3–6 months if unfixed:** Token sprawl, product patterns in DS, continued raw class usage.

**Overbuilt:** tokens-map.ts (governance only), seven themes when miniapp uses two.

**Underbuilt:** Stack gap, Modal (no Radix), Toast live region, ButtonRow adoption.
