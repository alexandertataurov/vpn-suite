# NewUserHero — Alignment Inconsistency Audit

## Issue

Description text (`.new-user-hero-desc`) appears **left-aligned** while icon and title are centered. Spec §4.10 requires "text-align: center" and "max-width 210px centered".

## Spec vs Implementation

| Spec (§4.10) | Implementation | Status |
|--------------|----------------|--------|
| text-align: center | `.new-user-hero` + `.new-user-hero-desc` both have it | ✓ Declared |
| Description: 13px/400, --text2, lh 1.6 | `--amnezia-hero-desc`, `--font-size-sm` fallback | ✓ |
| max-width 210px centered | `max-width: 210px; margin: 0 auto` | ✓ |

## Cascade Analysis

### Load order (index.css)

```
tokens → theme → layout → shell/frame.css → library.css → modern.css
```

`modern.css` loads last among design-system files, so `.new-user-hero-desc` should win on source order for same-specificity rules.

### Selectors affecting the `<p>`

| Selector | Specificity | Sets text-align? | File |
|----------|-------------|------------------|------|
| `.miniapp-shell p` | 0,1,1 | No (margin only) | frame.css:13 |
| `.miniapp-shell :where(p, li, dd, dt)` | 0,1,0 | No | frame.css:4949 |
| `.new-user-hero-desc` | 0,1,0 | Yes (center) | modern.css:914 |

No rule in frame.css sets `text-align` on `p`. `.new-user-hero-desc` explicitly sets `text-align: center`.

### DOM context

- **Production**: NewUserHero is inside `.miniapp-shell` (via ViewportLayout → StackFlowLayout).
- **Storybook (Pages)**: HomePage is rendered without ViewportLayout; no `.miniapp-shell` ancestor. Frame.css `.miniapp-shell` rules do not apply.

## Possible Causes for Persistent Left-Alignment

1. **Build/cache**: Change not reflected (stale build, cache, or HMR).
2. **App-level override**: `routes.css` or `app.css` loaded after design-system; grep found no direct `.new-user-hero` or `p` overrides.
3. **Telegram WebView**: Inline styles or UA styles in Telegram’s WebView could override.
4. **Specificity tie**: If another rule has same specificity and loads later, it could override. No such rule found in codebase.

## Recipe Inconsistencies

| Element | Expected | Risk |
|---------|----------|------|
| `.new-user-hero` | Centered card | Uses `hero-card` class — shared with PlanCard, ModernHeroCard. No conflicting rules found. |
| `.new-user-hero-desc` | Centered text | Explicit `text-align: center` present; override source unclear. |
| Font size | 13px per spec | `--amnezia-hero-desc: 13px` in base.css; `:where(p)` uses `--typo-body-size` (14–16px). Class wins on font-size. |

## Recommendations

1. **Raise specificity** for `.new-user-hero-desc` so it reliably wins:
   ```css
   .new-user-hero .new-user-hero-desc { text-align: center; }
   ```
2. **Mirror RenewalBanner** pattern: add a scoped override comment and use `.new-user-hero .new-user-hero-desc` (or `.new-user-hero p`) to override any `.miniapp-shell :where(p)` cascade.
3. **Verify in target env**: Test in Telegram WebView (production) and Storybook; confirm which context shows the bug.
4. **Optional**: Use `!important` only as last resort for `text-align` if WebView UA styles are confirmed as the cause.
