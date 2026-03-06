# src/lib

App shared code: types, API client, utils, and the single lucide-react entry. Not design system.

**Use `@/design-system` for** components, primitives, theme, layouts, and icon re-exports.

## Contents

| Path | Purpose |
|------|--------|
| **api-client/** | API client factory (`createApiClient`, `getBaseUrl`, refresh auth). |
| **types/** | WebApp* types, `ApiError`. |
| **utils/** | `cn`, `format*`, `getErrorMessage`, `useApiErrorToast`. |
| **icons.ts** | Single lucide-react entry (design-check allows only this file). Re-exported by `@/design-system`. |
| **percentClass.ts** | `getPercentClass` for plan/usage. |
| **statusMap.ts** | Status variant helpers (StatusBadge, etc.). |
| **storybook/** | Storybook fixtures, wrappers, TokenSwatch (used by design-system docs). |

Do not add UI components, theme, or new CSS here; add them under `src/design-system`.
