# Storybook Audit Report

Status: initial audit based on repo truth in `apps/miniapp/src/stories/`.

## Inventory Snapshot

- Total story files: **103**
- Foundations: **9**
- Primitives: **8**
- Components: **13**
- Patterns: **21**
- Recipes: **41**
- Pages: **11**

## What is already strong

- Foundations coverage is broad enough to validate color, typography, spacing, radius, shadows, icons, accessibility, and motion without leaving Storybook.
- The most important product surfaces already have page contracts: `Home`, `Onboarding`, `Plan`, `Devices`, `Checkout`, `Settings`, `Support`, `RestoreAccess`, `Referral`, `ConnectStatus`, and `SplashAndLoading`.
- The repo already uses explicit docs descriptions, viewport stories, and `contract-test` tagging on the highest-risk controls.
- Page contracts are wired to realistic sandboxes, not dummy component demos.

## Gaps and risks

| Area | Current state | Risk |
|------|---------------|------|
| Button contract | API is broad, but `lg` needed a fix and the story controls did not show it | Medium |
| Theme parity | Runtime and Storybook had slightly different startup paths | Medium |
| Responsive coverage | Key pages have viewport stories, but coverage is uneven by surface | Medium |
| Story state coverage | Many components have default/variant stories, but loading/error/disabled/empty coverage is not uniform | Medium |
| CTA wording | Some product copy is still generic or action order is unclear | High |
| Empty and error flows | Patterns exist, but product pages still vary in tone and specificity | High |

## Representative coverage matrix

| Surface | Coverage notes | Missing or incomplete |
|---------|----------------|-----------------------|
| Foundations | Color, typography, motion, radius, spacing, shadows, accessibility, icons | None critical |
| Controls | Button, Input, Select, Checkbox, Switch, Textarea, BillingPeriodToggle | Some state and size coverage remains uneven |
| Feedback | Modal, Toast, Skeleton, InlineAlert, ProgressBar | Loading/error/success examples could be broader |
| Compositions | RowItem, SegmentedControl, SettingsCard, ServerCard, EmptyStateBlock, PageStateScreen | Some patterns overlap with recipes and could be standardized further |
| Home / Onboarding / Plan | Strongest conversion-oriented surfaces with dedicated contracts | CTA hierarchy and microcopy still need polish |
| Devices / Settings / Support | Good real-product coverage | More explicit responsive and interaction slices would help |

## Completeness scoring rubric

- `5` = default, variants, states, responsive slices, accessibility, and interactive coverage
- `4` = mostly complete, with one meaningful gap
- `3` = usable but missing either responsive or state coverage
- `2` = partial demo only
- `1` = placeholder or insufficient contract surface

## Highest-priority findings

1. Standardize the CTA hierarchy on `Home` and `Onboarding` before expanding lower-priority polish.
2. Fix theme-runtime drift so Storybook and app startup use the same user-preference fallback logic.
3. Expand size/state coverage for the most reused controls first, especially `Button` and form primitives.
4. Use the existing page contracts as the main responsive test bed instead of adding more one-off component demos.

