# Page Models

Page models own page-level orchestration for the miniapp. Each page-model is a hook that aggregates data, shapes view-models, and exposes actions—keeping pages focused on composition.

## When to create a page-model

Create a page-model when a page:

- Orchestrates multiple data sources (session + plans + servers, etc.)
- Transforms data into a view-model for composition
- Coordinates mutations with derived state
- Needs page-specific loading/error/empty derivation

Do **not** create a page-model for single-mutation pages unless the team prefers 1:1 page-to-model convention (e.g. ConnectStatus, RestoreAccess).

## API shape

Return `{ header, pageState, ...viewModelFields, actions }`:

- **header**: StandardPageHeader for PageFrame
- **pageState**: StandardPageState (loading | error | empty | ready); error state **must** include `onRetry`
- **viewModelFields**: Derived data for the page—no raw `sessionQuery`, `plansQuery`, or mutation objects
- **actions**: `handleX` callbacks; no `mutation.mutate()` or `mutation.isPending` in the public API

Do **not** expose:

- Raw query objects (sessionQuery, plansQuery, usageQuery, historyQuery)
- Raw mutation objects (pauseMutation, cancelMutation, etc.)
- Internal implementation details

## pageState contract

- `empty`: Session missing or pre-condition not met; show SessionMissing
- `loading`: Initial load; show Skeleton
- `error`: Must include `title`, `message`, and `onRetry`; show FallbackScreen
- `ready`: Render page content

## Exceptions

- **Onboarding** runs pre-app_ready; it uses `useBootstrapContext`, `useSession`, `webappApi` directly and has no page-model.
