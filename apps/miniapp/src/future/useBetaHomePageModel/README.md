# useBetaHomePageModel — FUTURE CANDIDATE

**Why removed from Beta 1**: Alternative home page model; unused. Home uses `useAccessHomePageModel` instead.

**Dependencies**: Same as page-models (helpers, api, design-system, bootstrap).

**To restore**: Move back to `page-models/`, wire Home.tsx to use it, remove useAccessHomePageModel if replacing. Validate all Home flows.
