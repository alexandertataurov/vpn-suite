# `src/lib` — Shared Library Layer

Generic utilities and low-level shared code for the miniapp. **Do not** add feature logic, telemetry sinks, or dev tooling here.

## What belongs here

- **Pure utilities**: `percentClass`, format/error re-exports
- **API client**: HTTP client factory, base URL, refresh helpers
- **Query keys**: TanStack Query key factories (`webappQueryKeys`)
- **Icons**: Lucide re-exports

## What does not belong here

- **Feature logic** → `src/features/` or domain modules
- **Telemetry / analytics** → `src/telemetry/`
- **Referral / onboarding / bootstrap** → `src/bootstrap/`
- **Storybook mocks / fixtures** → `src/storybook/`

## Utils landscape

| Location | Purpose | Examples |
|----------|---------|----------|
| `src/utils` | Miniapp-local, build-time or alias targets | `tailwindMergeLite` (alias for `tailwind-merge`) |
| `lib/utils` | Re-exports / adapters from shared | format, error |
| `design-system/utils` | UI / design-system helpers | cx, getAriaLabelProps |

Use this rule when adding utilities: build-time or alias targets → `src/utils`; shared adapters → `lib/utils`; design-system helpers → `design-system/utils`.

## Rules

- **Purity**: `utils/` contains only pure helpers or re-exports. No I/O, storage, or global mutation.
- **Generic**: Helpers must be reusable across features, not tied to one flow.
- **Explicit**: Avoid vague names (`helpers`, `common`, `misc`). Each module has a clear purpose.
