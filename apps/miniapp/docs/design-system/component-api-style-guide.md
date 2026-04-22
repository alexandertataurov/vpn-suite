# Component API Style Guide

## Canonical prop model

Use the same prop vocabulary across the design system:

- `variant` = visual style
- `size` = density / scale
- `tone` = semantic emphasis
- `loading` or `state` = runtime feedback
- `disabled` = unavailable interaction

Prefer those names over `kind`, `type`, or app-specific aliases unless there is a concrete compatibility reason.

## Button contract

| Prop | Canonical values | Notes |
|------|------------------|-------|
| `variant` | `primary`, `secondary`, `danger`, `external` | Keep these as the visible storybook contract |
| `size` | `sm`, `md`, `lg`, `icon` | `lg` maps to the real large touch target |
| `tone` | `default`, `success`, `warning`, `danger` | Semantic tone only for primary buttons |
| `loading` / `transientState` | `idle`, `loading`, `success`, `error` | Use for async feedback and status announcements |

Notes:

- `ghost`, `outline`, and `link` should be treated as compatibility aliases rather than new conceptual variants.
- Avoid introducing new button variants unless they are distinct in both behavior and visual treatment.
- Use one primary CTA per screen whenever possible.

## Input contract

| Prop | Purpose |
|------|---------|
| `label` | Visible field label |
| `description` | Helper copy before or after the field |
| `error` | Validation failure message |
| `success` | Positive validation or confirmation message |
| `required` | Marks required fields semantically and visually |
| `helperPosition` | Moves helper content above or below the control |

Rules:

- Prefer `Field` + input control composition for new forms.
- Use `error` only when the field is actually failing validation.
- Do not overload placeholder text as the only instruction.

## Composition guidance

- Use compound subparts only when a component has a stable multi-region layout, such as `Header` / `Body` / `Footer`.
- Favor design-system recipes and patterns for page-shaped structure instead of making every block a compound component.
- Keep slot-based APIs for cases where visual placement truly matters more than the exact element tree.

## Consistency rules

- Keep storybook controls aligned with public props.
- Keep default values sensible so the common case requires the fewest props.
- When a prop becomes an alias, document it explicitly and avoid making it the preferred name.

