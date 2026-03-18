# Mobile Platform Guidelines

Version: 1.0
Audience: Miniapp frontend contributors and reviewers
Scope: `frontend/miniapp` product UI
Goal: Apply iOS and Android mobile design guidance without changing the current miniapp visual language.

---

# Purpose

This document defines the **platform rules** the miniapp should follow when new UI is added or existing UI is changed.

It does **not** require a redesign.

The current miniapp design system remains the source of truth for:

- tokens
- components
- patterns
- spacing scale
- typography scale
- color system

These guidelines exist to keep the current design compatible with modern iOS and Android expectations.

---

# Core Rule

Keep the existing miniapp visual identity, but enforce platform-safe behavior for:

- touch targets
- text legibility
- spacing between controls
- scrolling and layout fit
- navigation clarity
- accessibility
- motion and feedback

Do not restyle screens to look "more iOS" or "more Android" unless explicitly requested.

---

# Shared Mobile Rules

Apply these rules on both iOS and Android.

## 1. No Horizontal Scrolling for Primary Content

- Primary content must fit the viewport width.
- Users must not need to zoom or scroll horizontally to complete core tasks.
- Layout bugs that clip text, buttons, chips, or cards are release blockers.

Use:

- fluid width containers
- wrapping text
- mobile-safe gaps
- page-level overflow checks in Playwright

## 2. Touch Targets Must Be Large Enough

- Interactive targets must be large enough for thumb use.
- If the visible control is smaller than the minimum target, add padding around it.
- Small icon-only controls must still meet minimum target requirements.

Miniapp enforcement:

- iOS floor: `44pt`
- Android floor: `48dp`
- Product rule: target at least `48 x 48 CSS px` for all tappable controls

## 3. Text Must Stay Legible

- Body text must remain readable on mobile without zoom.
- Avoid squeezing multiple small text styles into dense cards.
- Do not use text as the only way to create hierarchy; use spacing and grouping too.

Miniapp enforcement:

- do not ship body copy below the equivalent of Apple’s minimum legibility guidance
- prefer current DS body scales over introducing smaller one-off text
- if text density rises, increase spacing before reducing font size

## 4. Spacing Must Prevent Mis-taps

- Adjacent interactive elements need enough space to avoid accidental taps.
- Dense action clusters are allowed only when each item still keeps its own safe target area.

Miniapp enforcement:

- keep existing DS spacing tokens
- add container padding before shrinking target size
- avoid icon/button groups that visually or interactively collapse together

## 5. Accessibility Is Default Behavior

- Interactive graphics need accessible labels.
- Focus/pressed/disabled states must stay visible.
- Information must not rely on color alone.
- Keyboard and assistive-technology navigation must remain intact.

---

# iOS Guidelines

Source basis: Apple Human Interface Guidelines and Apple design tips.

## 1. Hit Targets

Apple guidance: controls should be at least `44 x 44 pt`.

Miniapp rule:

- treat `44pt` as the minimum acceptable iOS interaction size
- keep `48px` as the preferred shared target in our web UI
- add padding around compact icon buttons before shrinking visuals

**Touch target audit (design system):** `.page-hd-btn`, `.btn-primary`, `.btn-secondary`, `.icon-btn`, `.op-ico`, plan card buttons (`.modern-plan-card` + `Button`), bottom nav items use `var(--size-touch-target)` or `min-height: 44px`/`48px`. Non-interactive elements (`.bar-track`, `.feat-ico`, `.lr-ico`) may be smaller; ensure adjacent tappable controls meet 48px.

## 2. Minimum Readable Text

Apple guidance: text should be at least `11pt` and custom type should follow recommended defaults; iOS default body size is `17pt` with `11pt` minimum.

Miniapp rule:

- avoid introducing new text styles below current caption/body usage
- body/supporting copy should remain readable at arm’s length on iPhone screens
- if a block becomes dense, restructure layout before reducing text size

## 3. Dynamic Type Mindset

Apple guidance favors text enlargement and Dynamic Type support.

Miniapp rule:

- avoid fixed-height text containers that break when content wraps
- prefer auto-height cards, rows, and alerts
- titles, subtitles, and operation descriptions must tolerate 2-line wrapping where practical

## 4. Content Fit and Clarity

Apple guidance: content should fit the screen, primary content should be obvious, and controls should sit near the content they modify.

Miniapp rule:

- keep primary actions close to the content they affect
- avoid detached CTA rows that feel unrelated to the card or section above them
- preserve clear page hierarchy: header -> hero/summary -> section label -> actions/content

## 5. Padding Between Controls

Apple accessibility guidance emphasizes spacing between controls as much as control size.

Miniapp rule:

- when controls have visible bezels, keep enough surrounding space to avoid overlap
- when controls are text links or icon-only affordances, increase spacing further
- treat tightly packed bottom-nav, segmented controls, and quick actions as high-risk areas

---

# Android Guidelines

Source basis: Android Developers adaptive app quality guidance and Material 3 accessibility guidance.

## 1. Touch Targets

Android guidance: interactive elements should be at least `48dp`.

Miniapp rule:

- all tappable controls should meet or exceed `48 x 48 CSS px`
- if visual icons are smaller, enlarge the tappable container rather than the icon itself
- do not allow touch-target overlap in dense rows

## 2. Typography Hierarchy

Material 3 guidance emphasizes a structured type scale with `title`, `body`, and `label` roles.

Miniapp rule:

- map existing DS text roles consistently:
  - page titles -> title/headline role
  - card/action names -> title/body-strong role
  - descriptions -> body role
  - metadata/chips -> label role
- avoid ad-hoc font sizes that bypass the DS scale

## 3. Color and Contrast Roles

Material 3 guidance expects semantic color roles with accessible contrast.

Miniapp rule:

- keep using semantic DS tokens rather than one-off foreground/background pairs
- pair content with the correct semantic "on" color equivalent
- do not place accent text on unrelated accent surfaces if contrast drops

## 4. Focus, Keyboard, and Non-touch Inputs

Android quality guidance requires focus indication for custom interactive elements and support for main task flows with keyboard navigation.

Miniapp rule:

- custom cards that act like buttons or links must preserve visible focus treatment
- do not remove focus outlines without a replacement
- navigation and primary flows must remain operable with keyboard/desktop input in Telegram Web/Desktop contexts

## 5. System Motion and Scroll Behavior

Material 3 guidance includes modern ripple/overscroll/system behaviors.

Miniapp rule:

- keep motion subtle and functional
- avoid decorative motion that delays task completion
- scroll containers must feel stable on touch devices and must not trap users near fixed header/nav regions

---

# Miniapp-Specific Interpretation

Because this product is a Telegram miniapp rendered in a web runtime, we do **not** build separate iOS and Android skins.

We apply the stricter compatible subset instead:

- minimum tap area: `48 x 48 CSS px`
- no horizontal overflow in page content
- no unreadable sub-body text
- no clipped fixed-header or bottom-nav interactions
- visible focus/pressed/disabled states
- semantic tokens only

When Apple and Android guidance differ, use the rule that reduces risk for both:

- prefer the larger target
- prefer more spacing
- prefer more robust wrapping
- prefer semantic accessibility over visual compactness

---

# PR Review Rules

Use these checks when reviewing mobile UI changes.

- `PASS`: all new interactive controls meet shared touch target guidance
- `PASS`: no new horizontal overflow appears at `320px`, `360px`, or `390px`
- `PASS`: body/supporting text remains readable on phone widths
- `PASS`: labels and helper text wrap cleanly instead of clipping
- `PASS`: focus and pressed states remain visible
- `PASS`: color usage stays inside DS semantic tokens
- `FAIL`: mobile changes rely on tighter font sizes instead of better layout
- `FAIL`: controls are visually or interactively smaller than platform guidance
- `FAIL`: fixed header or bottom navigation obscures content or actions
- `FAIL`: icon-only actions ship without accessible labeling

---

# Validation

Run these checks for mobile-facing UI changes:

```bash
npm --prefix frontend run lint -w miniapp
npm --prefix frontend run build -w miniapp
cd frontend/miniapp && npm exec -- playwright test e2e/responsive-layout.spec.ts --project=chromium
cd frontend/miniapp && npm exec -- playwright test e2e/visual-regression.spec.ts --project=chromium
```

---

# Sources

Official references used for this document:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Apple UI Design Dos and Don’ts: https://developer.apple.com/design/tips/
- Apple Accessibility guidance: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Android adaptive app quality guidelines: https://developer.android.com/docs/quality-guidelines/adaptive-app-quality
- Android accessibility API defaults: https://developer.android.com/develop/ui/compose/accessibility/api-defaults
- Android Material 3 guidance: https://developer.android.com/develop/ui/compose/designsystems/material3
