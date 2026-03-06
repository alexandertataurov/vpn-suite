# React + TypeScript Frontend Project Blueprint

Reference for the miniapp frontend: structure, configs, architecture, and conventions.

**Project type:** Telegram Mini-App / embedded webapp  
**Scale:** Small team (2–5)  
**Constraints:** Design system exists; strict bundle size; no SSR; Telegram WebApp API; token-only CSS (no inline styles)

---

### 1. Directory Structure

Feature-based layout; shared vs feature-local distinction:

```
src/
  app/                    # Shell: ViewportLayout, AppRoot, SafeAreaLayer, OverlayLayer, routing entry
  bootstrap/              # App bootstrap (BootstrapController, machine)
  pages/                  # Route boundary components (Home, Plan, Devices, Settings, …)
  design-system/          # Shared UI (single import surface)
    tokens/               # TS + CSS token governance
    primitives/           # Box, Stack, Container, Panel, Text, Divider (from ui/)
    components/           # Button, Typography, TelegramThemeBridge
    layouts/              # PageSection, PageFrame, HeaderZone, ScrollZone, ActionZone
    patterns/             # MissionCard, FallbackScreen, HomeHeroPanel, …
    theme/                # ThemeProvider, useTheme
    styles/               # index.css, miniapp-tokens.css, miniapp-*.css
    ui/                   # Low-level: buttons, forms, feedback, typography (design-system internals)
    index.ts              # Barrel — import from @/design-system only
  features/               # (Optional future) feature modules if scale grows — e.g. billing, devices
  api/                    # API client, base URL, typed fetchers
  context/                # TelegramContext, MainButtonReserveContext
  hooks/                  # Global hooks: useSession, useApiHealth, useTelemetry, useScrollInputIntoView
    telegram/             # useTelegramApp, useSafeAreaInsets, useTelegramTheme, …
    controls/             # useBackButton, useMainButton, useFullscreen
    features/             # usePayments, useClipboard, useShare, useQrScanner
    system/               # usePopup, useHaptics, usePermissions, useCloudStorage, …
  telegram/               # telegramClient, telegramEvents, feature/core clients
  lib/                    # Shared: types (webapp.ts), utils (format, cn), icons, storybook helpers
  utils/                  # App-level utils (e.g. tailwindMergeLite)
  telemetry/              # sentry, tracking
  main.tsx
  App.tsx
```

- **Types:** Shared in `lib/types/` (e.g. `webapp.ts`); feature-local in feature folder or next to consumer.
- **Test co-location:** `.stories.tsx` next to component; e2e in `e2e/` (Playwright). Unit tests: colocated `.test.tsx` or `__tests__/` in design-system (excluded from tsconfig for build).

---

### 2. Core Config Files

#### tsconfig.json

Base (e.g. `../tsconfig.base.json`): strict mode, path aliases, no implicit any:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules"]
}
```

App (miniapp):

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/lib": ["./src/lib"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.stories.tsx", "src/**/*.stories.ts", "src/**/*.test.tsx", "src/**/*.test.ts"]
}
```

#### vite.config.ts

```ts
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const analyzeBundle = process.env.ANALYZE === "1";

export default defineConfig({
  plugins: [
    react(),
    ...(analyzeBundle
      ? [
          visualizer({
            filename: "dist/bundle-analysis.json",
            template: "raw-data",
            gzipSize: true,
            brotliSize: true,
          }) as PluginOption,
        ]
      : []),
  ],
  base: "/webapp/",
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  server: {
    port: 5175,
    proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } },
  },
  build: { outDir: "dist" },
});
```

#### eslint.config.js (flat config, standalone app)

With `@typescript-eslint/strict` and `import/order` optional; miniapp rule for no inline `style`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { React: "readonly", JSX: "readonly" },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { react },
    rules: {
      "react/forbid-dom-props": ["warn", { forbid: ["style"] }],
    },
  }
);
```

#### prettier.config.cjs

```cjs
module.exports = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
};
```

---

### 3. Layered Architecture

| Layer | Choice | Rationale | Rejected |
|-------|--------|-----------|----------|
| State (server) | TanStack Query | Cache, dedup, loading/error, fits REST + small team | Redux (overkill), SWR (less ecosystem) |
| State (client/UI) | React state + Context (Telegram, MainButton) | Minimal; no global client store needed | Zustand/Redux for this scale |
| Routing | react-router-dom v6 | SPA, lazy routes, nested layouts | Next.js (no SSR requirement) |
| Styling | CSS + design tokens (var(--ds-*)), no inline styles | Bundle size, design system contract (see [TELEGRAM_DESIGN_SYSTEM.md](TELEGRAM_DESIGN_SYSTEM.md)) | Tailwind in miniapp (bundle), CSS-in-JS (runtime cost) |
| Forms | Controlled components + local state | Simple flows; no heavy forms | React Hook Form (optional if forms grow) |
| Data fetching | useQuery/useMutation + typed API client | Typed responses, key invalidation | fetch in components (no cache) |
| Testing | Playwright e2e, Storybook for UI | E2E for flows; stories for design system | Jest RTL (add if unit tests needed) |
| Bundler | Vite | Fast HMR, small config, ESM | CRA, Webpack |

---

### 4. Type System Conventions

- **Shared types:** `lib/types/*.ts` (e.g. `webapp.ts`); naming `*.types.ts` optional for feature-local.
- **API responses:** Hand-written interfaces in `lib/types/webapp.ts`. Alternative: Zod schemas + `z.infer<>` for runtime parse + types.
- **Component props:** Prefer `type Props = { ... }` or `interface Props`; export when reused. Inline for single-use.
- **Forbidden:** `any`; TS enums → use `as const` object + union type; no implicit any (tsconfig strict).

---

### 5. Component Architecture

- **UI primitives** → `design-system/ui/` re-exported via `design-system/primitives` (Box, Stack, Input, Button, Modal). No business logic.
- **Feature components** → Composed in `pages/` or `design-system/patterns/` from primitives + domain (e.g. HomeHeroPanel, MissionCard).
- **Page components** → `pages/*.tsx`; routing boundary; data fetching (useQuery/useSession) and layout (PageFrame, ScrollZone, ActionZone).
- **Layout** → `design-system/layouts/` (PageSection, PageFrame, HeaderZone, ScrollZone, ActionZone); app shell in `app/ViewportLayout.tsx`.

Rules:

- Split when file > ~250 lines or clear reuse boundary; otherwise keep in one file.
- Prop drilling: max 2–3 levels; then Context or composition.
- Colocate state with the component that owns it; lift to shared hook or context only when multiple siblings need it.

---

### 6. Data Flow (Concrete)

```
Route (App.tsx) → lazy(Home) → HomePage
  → useSession(hasToken) [hook]
  → useQuery({ queryKey: ["webapp", "servers"], queryFn: () => webappApi.get<WebAppServersResponse>(...) })
  → api/client (webappApi.get: typed fetch)
  → Backend JSON
  → Hand-written WebAppServersResponse in lib/types/webapp.ts (no Zod parse)
  → data: WebAppServersResponse | undefined
  → UI (design-system components + loading/error states)
```

Files: Route in `src/App.tsx`; page `src/pages/Home.tsx`; hook `useSession`; API `api/client`; types `src/lib/types/webapp.ts`.

---

### 7. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Component file | PascalCase | `Home.tsx`, `MissionCard.tsx` |
| Hook file | camelCase, `use` prefix | `useSession.ts`, `useTelemetry.ts` |
| Type file | kebab or domain | `webapp.ts`, `user.types.ts` |
| Store/context file | PascalCase + Context | `TelegramContext.tsx` |
| Test / stories | colocated | `Button.stories.tsx`, `HomePage.stories.tsx` |
| E2E | e2e/*.spec.ts | `visual-regression.spec.ts` |
| Constant | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| CSS | kebab, token-only | `miniapp-tokens.css`, classes via tokens |

---

### 8. CI/CD and DX Scripts

**package.json scripts:**

- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `lint`: `eslint src --ext .ts,.tsx` or `eslint "src/**/*.{ts,tsx}"` (flat config)
- `test:e2e`: build then `playwright test`
- `build`: `vite build`
- `build:ci`: build + optional `check:css-budget`
- `dev`, `preview`, `storybook`, `build-storybook`

**Minimal GitHub Actions (frontend-only)** — `.github/workflows/frontend-ci.yml`:

```yaml
name: Frontend CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend/miniapp

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Build
        run: pnpm run build

      # Optional: e2e (requires build + Playwright)
      # - name: E2E
      #   run: pnpm run test:e2e
```

(Monorepo: run from repo root with `pnpm -C frontend/miniapp run typecheck` etc. if needed.)

---

### 9. Anti-Patterns (Lint/Convention)

| Anti-pattern | Prevention |
|--------------|------------|
| `useEffect` for derived state | Derive in render or useMemo; ESLint react-hooks/exhaustive-deps + review |
| Inline `style` prop | `react/forbid-dom-props: [warn, { forbid: ["style"] }]` for miniapp |
| `any` type | tsconfig strict + noImplicitAny; ESLint @typescript-eslint/no-explicit-any |
| Raw `div` for layout instead of primitives | Convention + design system doc; optional ESLint/stylelint |
| Fetch in component without cache | Use TanStack Query only for server state; code review |
| Prop drilling > 3 levels | Convention; introduce Context or composition when exceeded |
| Hardcoded px/hex in CSS | Stylelint or token-only policy; design system doc |
| Enums for constants | Convention: `as const` object + type union |

---

**Scale/constraint notes:** For 5–15 people or SSR: add feature-based `features/*` with own hooks/api; consider Next.js or Remix; enforce no cross-feature imports. This blueprint targets 2–5 and no SSR.
