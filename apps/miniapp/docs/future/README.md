# Experimental / future code (optional `src/future/`)

There is no `src/future/` directory in the tree by default. **Recreate** `apps/miniapp/src/future/` when you need a scratch area for spikes that must not ship in `pages/` or `page-models/` yet.

**Removed from tree (restore via git if needed):** alternate home hook `useBetaHomePageModel`, and the unused `useServerSelectionPageModel` scaffold (no `/servers` route in the current beta). Reintroduce a server picker with a new page-model and tests when product requires it.
