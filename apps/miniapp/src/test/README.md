# Miniapp Test Infrastructure

## Structure

```
src/test/
├── setup.ts          # Global setup: jest-dom, cleanup
├── fixtures/         # Shared test data
│   └── session.ts    # WebAppMeResponse fixtures
├── utils/
│   ├── render.tsx    # createWrapper, renderWithProviders
│   └── matchers.ts   # expectApiPostCall
└── README.md
```

## Writing Tests

### Provider wrapper

Use `createWrapper()` from `@/test/utils/render` for hooks/components that need:

- QueryClient (React Query)
- MemoryRouter (React Router)

```tsx
import { createWrapper } from "@/test/utils/render";

renderHook(() => useSession(true), { wrapper: createWrapper() });
```

### Fixtures

Import session fixtures from `@/test/fixtures/session`:

- `webappMeCompleted` — minimal session with completed onboarding
- `webappMeActive` — session with active subscription

### Assertion helpers

Use `expectApiPostCall` for typed assertions on API post calls:

```ts
import { expectApiPostCall } from "@/test/utils/matchers";

expectApiPostCall(postMock.mock.calls[0], "/webapp/telemetry", { event_type: "cta_click" });
```

### Mocks

Use `vi.hoisted()` for mocks referenced in `vi.mock()` factories, since factories run before imports:

```ts
const { mockPost, mockUseWebappToken } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockUseWebappToken: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  webappApi: { post: mockPost },
  useWebappToken: () => mockUseWebappToken(),
}));
```

### Async tests

Avoid empty `waitFor` callbacks. Use meaningful assertions:

```ts
// Bad
await waitFor(() => {}, { timeout: 200 });

// Good
await waitFor(() => expect(mockPost).not.toHaveBeenCalled(), { timeout: 300 });
```

## Page integration tests

Page components (e.g. HomePage) require many providers (ThemeProvider, ToastContainer, LayoutProvider, TelegramProvider). To add page integration tests:

1. Extend `createWrapper` to include all required providers, or
2. Mock design-system/context modules for page-level tests.

## Coverage

Tests are colocated with source (`*.test.ts` / `*.test.tsx`). Vitest excludes `src/design-system/**` and `src/telegram/**` from coverage. See `vitest.config.ts` for thresholds.
