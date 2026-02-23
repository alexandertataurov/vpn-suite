# Research Summary — Operator-Grade Design System

## Sources consulted (public)
- Stripe Apps style system (token usage, CSS variables)
- Shopify Polaris tokens (semantic tokens and consumption guidance)
- Atlassian Design System tokens (semantic tokens and migration)
- Radix UI primitives (behavior-first primitives, composition)
- Headless UI patterns (unstyled, accessible behavior)
- IBM Carbon structure (token roles and governance)
- W3C Design Tokens Community Group (token standardization)

## Adopted principles and implications

| Principle | Source alignment | Implementation implication |
| --- | --- | --- |
| Token-first architecture | Stripe Apps, Polaris, Atlassian, DTCG | All UI uses semantic CSS variables; primitives never use raw values. |
| Primitive-first layering | Radix UI, Headless UI | Build strict primitives first, then composites built only from primitives. |
| Variant minimalism | Polaris, Carbon | Limit variants and sizes to reduce API surface. |
| Strict API design | Radix UI, Carbon | Union types for variants/sizes; no stringly-typed props. |
| Behavior vs style separation | Headless UI, Radix UI | Behavior in primitives, visuals in tokens/CSS only. |
| Accessibility-first | Radix UI, Headless UI | Keyboard, focus, ARIA supported by default. |
| Composition over inheritance | Radix UI | Composites compose primitives; no deep class overrides. |
| Zero duplication philosophy | Atlassian, Carbon | Single source for tokens, no duplicated components. |
| Documentation-driven | Atlassian, Polaris | Storybook docs required for every primitive/composite. |

## Constraints applied
- No hardcoded color values outside tokens.
- No inline styles in primitives/composites.
- Semantic tokens only in components.
- Minimal radius, shadows, and typography scale.
