# Design Token Architecture

## Token model

Miniapp uses semantic tokens for component consumption and primitive tokens for governance.

### Semantic color roles

| Role | Meaning | Notes |
|------|---------|-------|
| `bg` | Page and app chrome | Base surface for the whole screen |
| `surface` | Primary cards and panels | Use for elevated content blocks |
| `surface-2` | Nested surfaces | Use sparingly to preserve hierarchy |
| `overlay` | Modals and scrims | Keep opaque enough for focus |
| `text` | Primary copy | Default readable text |
| `text-muted` | Secondary copy | Supporting information only |
| `text-tertiary` | Metadata, placeholders, disabled hints | Lowest-emphasis readable text |
| `border` | Default separators | Use for core grouping boundaries |
| `border-subtle` | Fine dividers | Prefer this when structure should stay quiet |
| `border-strong` | Emphasis borders | Reserve for important grouping |
| `accent` | Primary action | Use for the main CTA and active states |
| `success` | Positive state | Confirmations and connected states |
| `warning` | Caution state | Renewal, attention, and soft risk |
| `error` | Failure / destructive state | Errors and destructive intent |
| `info` | Neutral information | Education, helper, or system info |

## Rules

- Components consume tokens through `var(--*)` only.
- Do not hardcode raw hex, rgb, hsl, or named colors in component code.
- Keep radius values tokenized. The current card/surface contract should stay centered on the `14px` family where the theme already uses it.
- Keep motion CSS and JS aligned with `MOTION_TOKENS` and `MOTION_DURATION_MS`.
- Treat `48px` as the mobile touch target floor.

## Theme behavior

- App startup should set `data-theme` before React mounts.
- `ThemeProvider` should honor stored choice first, then existing HTML theme, then system preference, then default theme.
- Theme switching must persist to localStorage when the storage layer is available.
- Theme switching should update `color-scheme` to keep browser controls and form surfaces consistent.

## Missing tokens to add only if needed

- `text-disabled` if a future component needs a distinct disabled-copy treatment that is not covered by `text-tertiary`
- `bg-overlay` if multiple overlay layers need a dedicated semantic alias separate from `overlay`
- `border-divider` if content separators need a clearer semantic than the current border tiers

These are deferred until a concrete component need appears.

