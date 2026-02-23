# Storybook Fixtures & Helpers

## Shared Storybook Helpers
- `frontend/shared/src/storybook/fixtures.ts`
  - Shared copy for long/short text, numbers, dates, and list items.
- `frontend/shared/src/storybook/wrappers.tsx`
  - `StoryStack`, `StoryRow`, `StoryGrid`, `StoryPanel`, `StorySection`, `NarrowFrame`.
- `frontend/shared/src/storybook/storybook.css`
  - Token-based layout utilities (`sb-*` classes).

## Miniapp Storybook Helpers
- `frontend/miniapp/src/storybook/fixtures.ts`
  - `WebAppMeResponse` fixtures for subscription/device variants.
- `frontend/miniapp/src/storybook/webappMocks.tsx`
  - Fetch intercept for `/webapp/me` and `/webapp/devices/issue`.
- `frontend/miniapp/src/storybook/wrappers.tsx`
  - `MiniappFrame` layout wrapper for page stories.
