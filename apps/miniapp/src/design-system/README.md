# Miniapp design system

Documentation: [docs/design-system/README.md](../../docs/design-system/README.md).

## Canonical structure

`src/design-system/`

- `foundations/` — tokens + theme runtime (`@ds/foundations`)
- `primitives/` — low-level layout/typography primitives (`@ds/primitives`)
- `components/` — reusable UI components (`@ds/components`)
- `patterns/` — reusable composed UI structures (`@ds/patterns`)
- `recipes/` — product-facing composed modules (`@ds/recipes`)
- `layouts/` — page shells and structural composition (`@ds/layouts`)
- `icons.ts` + `icons/` — icon exports
- `hooks/` — design-system hooks
- `utils/` — design-system utilities

## Compatibility

- Legacy entrypoints (`core/`, `compositions/`) are still re-exported from `index.ts`.
- Legacy `patterns/RowItem` deep imports are bridged to `patterns/row-item`.

## Naming rules

- Use `kebab-case` for new folders.
- Keep component filenames in `PascalCase.tsx`.
- Prefer importing through top-level entrypoints over deep paths unless the deep path is intentional.
