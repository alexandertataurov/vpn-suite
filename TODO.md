# TODO

## Release Priorities

### P0: Fix before wider beta exposure

- [ ] Enforce Telegram WebApp `auth_date` freshness during `initData` validation.
- [ ] Make refresh-token rotation atomic.
- [ ] Make one-time config download token consumption atomic.
- [ ] Stop trusting client-supplied forwarding headers unless the request came through a trusted proxy.
- [ ] Add regression coverage for the auth/token/proxy issues above.
- [ ] Write rollout notes for the P0 fixes so they can ship without breaking active sessions or config downloads.

### P1: Align product surface and runtime

- [ ] Decide whether the bot is a minimal launcher or a full conversational product, then align code and docs with that decision.
- [ ] Unify WebApp principal resolution and stop hand-parsing bearer tokens in multiple routers.
- [ ] Consolidate peer/device issuance endpoints behind one canonical API.
- [ ] Repair the API docs source-of-truth model.
- [ ] Align bot documentation with the bot that actually runs.

### P2: Cleanup after product/risk alignment

- [ ] Reduce `/servers` route fragmentation and remove include-order coupling.
- [ ] Deprecate or remove duplicate API aliases.
- [ ] Review and remove likely unused endpoints.
- [ ] Fix duplicate background loop scheduling in the worker startup path.
- [ ] Consolidate repeated `ServerOut` serialization logic.
- [ ] Standardize backend pagination contracts and remove legacy `page/page_size` support where possible.
- [ ] Remove stale feature flags and leftover wrapper modules.
- [ ] Update or narrow `docs/codebase-map.md`.
- [ ] Fix top-level doc indexes and consolidate duplicate bot doc narratives.

## Decisions / ADRs

- [ ] Record the bot product decision explicitly.
  - Decision: `launcher-only bot` vs `full conversational bot`
  - Impacted areas: `bot/`, backend bot-facing APIs, docs, BotFather commands, support/release process
  - Output: short ADR or product decision note linked from `docs/README.md`

- [ ] Record the canonical self-service API model explicitly.
  - Decision: whether self-service lives fully under `/webapp/*` or remains split across mixed namespaces
  - Impacted areas: miniapp client, backend auth dependencies, docs, OpenAPI
  - Output: API contract note with migration path for any legacy routes

- [ ] Record the beta Mini App information architecture explicitly.
  - Decision: one-route beta flow plus `settings` and `checkout`
  - Impacted areas: miniapp routes, page docs, QA, release gates
  - Output: short architecture note that marks removed/deferred routes

- [ ] Record the deprecation policy for compatibility endpoints and docs.
  - Decision: how deprecations are marked, tracked, announced, and removed
  - Impacted areas: backend routes, OpenAPI, docs, changelog
  - Output: one deprecation policy doc or `CONTRIBUTING.md` section

## Beta Scope / Product Simplification

- [ ] Collapse the Mini App beta experience around one primary route plus settings and checkout.
  - Files: `frontend/miniapp/src/app/`, `frontend/miniapp/src/pages/`, route config, related docs/specs
  - Problem: the beta strategy calls for a focused access-management flow, but the product surface still trends toward a dashboard-style multi-page app.
  - Fix: make `/` the core product flow, keep `settings` and `checkout` separate, and merge/remove low-signal beta screens.

- [ ] Reduce competing navigation and state branching in the Mini App.
  - Files: Mini App layout, navigation components, page model docs, beta release docs
  - Problem: beta should present one clear next action per user state, but the current structure still exposes too many parallel destinations and product concepts.
  - Fix: simplify navigation, remove low-priority entry points, and drive state-specific CTAs from the main hero.

- [ ] Merge onboarding, plan selection, device issuance, and config delivery into one guided beta flow.
  - Files: Mini App onboarding/plan/device/config screens, related hooks and API calls
  - Problem: setup still appears fragmented across multiple screens and mental models.
  - Fix: keep the purchase-to-config path linear, with one primary action at each step and no dashboard-style detours.

- [ ] Keep existing users out of onboarding flows.
  - Files: Mini App landing logic, session/bootstrap hooks, state docs
  - Problem: returning users should land in access management, not in acquisition/setup messaging.
  - Fix: branch the home experience by access state and show renew/add-device/download-config actions directly.

- [ ] Remove or defer beta-hostile product surface.
  - Candidates:
    - standalone plans page
    - standalone devices page
    - standalone support/status/referral pages
    - server selection where not operationally necessary
    - “dashboard” visuals that imply the app is a VPN client
  - Problem: these screens add mental overhead and dilute the “buy access here, connect in AmneziaVPN” positioning.
  - Fix: merge into `/`, move to settings, or defer until after beta validation.

- [ ] Define the exact user-state matrix that drives the home screen.
  - States:
    - new user, no subscription
    - subscribed, no device
    - subscribed, has device
    - expired/canceled
    - payment pending/recoverable
    - blocked/error state
  - Problem: “one primary action per state” only works if state ownership is explicit.
  - Fix: document the matrix, its trigger data, and the CTA shown for each state.

- [ ] Reduce route count and add redirects/removals deliberately instead of leaving zombie pages.
  - Files: Mini App router, navigation, route guards
  - Problem: removing pages at the UX level but keeping routes alive creates hidden maintenance surface and inconsistent flows.
  - Fix: decide per route whether it is removed, redirected, merged into `/`, or kept in settings/checkout.

- [ ] Rewrite beta copy around “access management,” not “VPN client.”
  - Files: Mini App copy, onboarding copy, docs, release copy
  - Problem: the beta strategy depends on the user understanding that AmneziaVPN is the client and the Mini App manages access.
  - Fix: audit and replace copy that implies tunnel status, client behavior, or a standalone VPN app mental model.

- [ ] Add a beta-only kill list for nonessential UI blocks.
  - Candidates:
    - detailed status panels
    - advanced referral modules
    - decorative telemetry/performance visuals
    - multi-step secondary flows on the home route
  - Problem: these features tend to re-enter scope unless there is an explicit removal list.
  - Fix: maintain a “not in beta” list in product/docs and enforce it during implementation review.

- [ ] Add beta acceptance criteria for the core flow.
  - Flow: open app -> choose/restore access -> add device -> download/import config
  - Problem: the current TODO has architecture intent, but not a pass/fail definition for beta readiness.
  - Fix: define required success states, failure states, and what can be deferred.

## Security / Auth

- [ ] Enforce Telegram WebApp `auth_date` freshness during `initData` validation.
  - File: `backend/app/core/security.py`
  - Problem: HMAC is verified, but stale captured `initData` can still be replayed to mint a new webapp session.
  - Fix: Parse `auth_date`, require it to be recent, and add regression tests for expired/replayed payloads.
  - Follow-ups:
    - choose an explicit max age window
    - make clock-skew behavior explicit
    - log rejected stale payloads without leaking sensitive data

- [ ] Make refresh-token rotation atomic.
  - File: `backend/app/api/v1/auth.py`
  - Problem: `/auth/refresh` checks the Redis blocklist before writing to it, so concurrent refresh requests can both succeed with the same token.
  - Fix: Use an atomic consume pattern in Redis or store refresh tokens server-side with single-use semantics.
  - Follow-ups:
    - define how refresh-token families are invalidated
    - ensure logout and refresh use the same token lifecycle rules
    - add race-focused tests, not just happy-path refresh tests

## Downloads / Tokens

- [ ] Make one-time config download token consumption atomic.
  - Files: `backend/app/core/one_time_download.py`, `backend/app/api/public_download.py`
  - Problem: token verification is `SELECT` then `UPDATE`, so concurrent requests can both consume the same token and both receive the config.
  - Fix: consume the token in one atomic DB operation and add a concurrency regression test.
  - Follow-ups:
    - decide whether “view QR” and “download config” should share one consume model
    - document the expiry/consumption semantics clearly for support and admin tooling

## Proxy / Rate Limiting

- [ ] Stop trusting client-supplied forwarding headers unless the request came through a trusted proxy.
  - Files: `backend/app/core/rate_limit.py`, `backend/app/core/request_logging_middleware.py`
  - Problem: `X-Forwarded-For` / `X-Real-IP` are accepted directly, which allows IP spoofing for rate limits and request logs in non-strict deployments.
  - Fix: define trusted proxy behavior explicitly or rely on the direct socket peer unless a trusted reverse proxy is confirmed.
  - Follow-ups:
    - define trusted proxy config in settings
    - document deployment assumptions in ops docs
    - verify reverse proxy behavior in compose and production configs

## Testing

- [ ] Add regression coverage for:
  - stale Telegram `initData`
  - concurrent refresh-token replay
  - concurrent one-time download replay
  - spoofed forwarding headers affecting rate limiting

- [ ] Add route-surface verification tests for the backend.
  - Files: `backend/tests/`, router registration/startup tests
  - Problem: mounted routes have already drifted away from the “current surface” docs without any failing test or export check.
  - Fix: add tests or snapshot generation that validate mounted routes against the declared contract source.

- [ ] Add docs freshness checks for canonical docs.
  - Files: `docs/api/`, `docs/codebase-map.md`, docs validation scripts
  - Problem: files marked as “precise,” “current,” or “canonical” can drift silently for long periods.
  - Fix: either generate them from code or add a CI check that blocks stale authoritative docs.

- [ ] Add concurrency-focused backend tests instead of only linear request tests.
  - Targets:
    - refresh token rotation
    - one-time downloads
    - any “single-use” session or action token
  - Problem: the current bug class is mostly race conditions, which ordinary endpoint tests do not catch.
  - Fix: add explicit concurrent request tests or lower-level service tests that simulate interleaving.

- [ ] Add contract drift checks between mounted routes, OpenAPI, and docs.
  - Files: `backend/app/main.py`, `openapi/openapi.yaml`, `docs/api/current-surface.md`
  - Problem: route inventory, OpenAPI, and Markdown references can all diverge independently today.
  - Fix: choose one generation flow and add a CI diff check.

- [ ] Add beta-flow integration tests for the Mini App.
  - Flow coverage:
    - new user purchase/setup
    - returning user add device
    - expired user renew flow
    - config delivery/import confirmation
  - Problem: beta simplification work needs end-to-end protection, not just unit coverage.
  - Fix: cover the core beta state transitions in frontend and API integration tests.

## API Surface / Cleanup

- [ ] Unify WebApp principal resolution and stop hand-parsing bearer tokens in multiple routers.
  - Files: `backend/app/api/v1/webapp.py`, `backend/app/api/v1/subscriptions_me.py`, `backend/app/core/bot_auth.py`
  - Problem: the same WebApp session parsing logic exists in multiple places, and the miniapp uses both `/webapp/*` and `/subscriptions/me` for one self-service flow.
  - Fix: create one reusable dependency for WebApp auth and keep WebApp self-service under one namespace.

- [ ] Consolidate peer/device issuance endpoints behind one canonical API.
  - Files: `backend/app/api/v1/wg.py`, `backend/app/api/v1/users.py`, `backend/app/api/v1/servers_peers.py`
  - Problem: issuance exists in multiple endpoint families with different request/response shapes and semantics.
  - Fix: choose one canonical issue/revoke flow, then keep the others only as thin compatibility wrappers or remove them.

- [ ] Reduce `/servers` route fragmentation and remove include-order coupling.
  - Files: `backend/app/main.py`, `backend/app/api/v1/servers.py`, `backend/app/api/v1/servers_peers.py`, `backend/app/api/v1/servers_actions.py`, `backend/app/api/v1/servers_sync.py`, `backend/app/api/v1/servers_stream.py`, `backend/app/api/v1/servers_telemetry.py`
  - Problem: server routes are spread across many routers and rely on registration order to avoid path shadowing.
  - Fix: expose one coherent `/servers` route tree and keep internal code splitting behind that boundary.

- [ ] Deprecate or remove duplicate API aliases.
  - Files: `backend/app/api/v1/overview.py`, `backend/app/main.py`
  - Problem: `/overview/telemetry` duplicates `/overview/dashboard_timeseries`, and `/api/telemetry/docker/*` duplicates `/api/v1/telemetry/docker/*`.
  - Fix: mark aliases as deprecated with removal dates, track usage, and delete them once clients migrate.

- [ ] Review and remove likely unused endpoints.
  - Files: `backend/app/api/v1/devices_stream.py`, `backend/app/api/v1/servers_peers.py`, `backend/app/api/v1/wg.py`
  - Candidates:
    - `GET /api/v1/devices/stream`
    - `GET /api/v1/servers/{server_id}/peers-live`
    - `POST /api/v1/wg/peer`
    - `DELETE /api/v1/wg/peer/{pubkey}`
  - Problem: current repo consumers appear limited or nonexistent outside tests/docs.
  - Fix: confirm real usage, then remove, hide, or relabel as internal/experimental.

- [ ] Inventory all self-service endpoints by client and mark ownership.
  - Clients:
    - admin UI
    - Mini App
    - bot
    - node-agent
    - internal/ops only
  - Problem: endpoint ownership is currently inferred from code rather than declared.
  - Fix: add a small ownership matrix and use it to drive deprecation/removal decisions.

- [ ] Normalize endpoint naming and resource boundaries.
  - Problem areas:
    - `devices` vs `peers`
    - mixed `bot/*`, `webapp/*`, and generic routes for the same user actions
    - mixed action naming (`issue`, `rotate`, `replace`, `reset`, `reissue`)
  - Problem: naming inconsistency makes APIs harder to reason about and document.
  - Fix: define canonical resource/action language and migrate toward it.

- [ ] Mark internal-only or compatibility routes explicitly in schema/docs.
  - Files: route decorators, OpenAPI generation, docs
  - Problem: consumers cannot currently tell which routes are product API, internal helper API, or compatibility shims.
  - Fix: use tags, schema visibility rules, and documentation labels consistently.

## Bot Backend

- [ ] Decide whether the bot is a minimal launcher or a full conversational product, then align the codebase with that decision.
  - Files: `bot/main.py`, `bot/commands.py`, `bot/api_client.py`, `bot/i18n.py`, `bot/keyboards/`, `bot/menus/`
  - Problem: the running bot only wires `/start` and payment confirmation, but the codebase still contains a much larger unused feature surface.
  - Fix: either remove dead bot features or register and support them end-to-end.

- [ ] Stop caching failed admin API responses in the bot TTL cache.
  - Files: `bot/utils/cache.py`, `bot/api_client.py`
  - Problem: `get_plans()` / `get_servers()` cache `Result.fail(...)` responses, so one backend timeout can poison the bot for the full TTL.
  - Fix: cache only successful results or make the cache aware of failure semantics.

- [ ] Reconcile supported Telegram update types with the bot’s UI model.
  - File: `bot/main.py`
  - Problem: polling/webhook mode currently allows only `"message"` updates, while the repo still contains callback-based keyboards and menu flows.
  - Fix: either enable callback query updates and wire those handlers, or delete the callback-based UX code.

- [ ] Add startup and router registration tests for the bot’s actual live surface.
  - Files: `bot/tests/test_handlers.py`, `bot/tests/`
  - Problem: tests only cover `/start` and basic API client behavior, so dead or disconnected bot features can remain in the repo unnoticed.
  - Fix: add tests that assert registered commands, included routers, allowed update types, and payment flow wiring.

- [ ] Make bot API error mapping endpoint-aware instead of using one generic status-code mapping.
  - File: `bot/api_client.py`
  - Problem: generic `400/404 -> error_device_not_found` is wrong for promo, plan, subscription, and payment endpoints.
  - Fix: use backend error codes per endpoint or separate response mappers by operation.

- [ ] Remove or archive dead bot modules once the product decision is made.
  - Candidates: unused handlers, callback menus, keyboard helpers, stale i18n keys, dead docs
  - Problem: leaving disconnected bot code in place will recreate drift even after the decision is documented.
  - Fix: make deletion/archival part of the same cleanup change, not a later “nice to have.”

- [ ] Align backend bot-facing endpoints with the chosen bot scope.
  - Files: `backend/app/api/v1/bot.py`, related docs/tests
  - Problem: the backend may continue exposing bot-specific APIs for features the live bot does not support.
  - Fix: either reduce the bot API surface or restore the bot features that depend on it.

## Backend Cleanup

- [ ] Fix duplicate background loop scheduling in the worker startup path.
  - File: `backend/app/worker_main.py`
  - Problem: telemetry, reconciliation, and node-scan loops are started in multiple branches, which can schedule the same work twice in common runtime configurations.
  - Fix: normalize startup branching so each loop is created exactly once per mode, and add tests for the worker startup matrix.

- [ ] Remove or isolate long-lived compatibility aliases from the main backend surface.
  - Files: `backend/app/main.py`, `backend/app/api/v1/overview.py`, `backend/app/api/v1/peers.py`, `backend/app/schemas/peer.py`
  - Problem: deprecated aliases like `/api/telemetry/docker/*`, `/overview/telemetry`, and `/peers` keep expanding the API surface and maintenance burden.
  - Fix: move aliases into an explicit compatibility layer with owners/removal dates, or delete them after client migration.

- [ ] Consolidate repeated `ServerOut` serialization logic.
  - Files: `backend/app/api/v1/servers.py`, `backend/app/api/v1/servers_crud.py`
  - Problem: server response shaping is hand-written in multiple endpoints, which increases drift and refactor cost.
  - Fix: centralize `Server -> ServerOut` conversion in one helper/serializer and reuse it everywhere.

- [ ] Standardize backend pagination contracts and remove legacy `page/page_size` support where possible.
  - Files: `backend/app/api/v1/servers.py`, `backend/app/api/v1/server_cache.py`, `docs/api/`
  - Problem: supporting both `limit/offset` and `page/page_size` adds avoidable handler, cache-key, doc, and test complexity.
  - Fix: choose one pagination model, deprecate the other, and simplify the route/cache logic.

- [ ] Remove stale feature flags and leftover wrapper modules.
  - Files: `backend/app/core/config.py`, `backend/app/services/control_plane/server_crud.py`, `backend/app/services/server_obfuscation.py`
  - Candidates:
    - `feature_outline_legacy`
    - thin compatibility-only helper modules with little independent value
  - Problem: old refactor residue makes the backend harder to reason about.
  - Fix: confirm remaining callers and delete or inline dead compatibility code.

- [ ] Separate current production behavior from compatibility and experimental surface.
  - Files: `backend/app/main.py`, deprecated routers, docs/openapi generation paths
  - Problem: live, legacy, and experimental endpoints are mixed together, which makes the backend harder to reason about and document.
  - Fix: explicitly tag or isolate compatibility/internal routes in code, docs, and OpenAPI generation.

- [ ] Add a backend surface reduction pass after beta-scope decisions land.
  - Targets:
    - routers with no product consumer
    - old aliases kept only for convenience
    - compatibility wrappers with no active client
  - Problem: cleanup should remove code, not just rename or re-document it.
  - Fix: treat surface reduction as a dedicated pass with before/after route inventories.

- [ ] Consolidate startup wiring patterns across app entry points.
  - Files: `backend/app/main.py`, `backend/app/worker_main.py`
  - Problem: route registration, background loops, compatibility mounts, and health wiring are spread across large startup files.
  - Fix: extract structured registration/bootstrap helpers so startup behavior is easier to inspect and test.

## Docs / Markdown Cleanup

- [ ] Align bot documentation with the bot that actually runs.
  - Files: `docs/bot.md`, `docs/bot/bot-menu-architecture.md`, `docs/bot/production-plan.md`, `bot/README.md`
  - Problem: most bot docs describe a callback-heavy self-service bot, while the live runtime currently exposes a much smaller surface centered on `/start`, Mini App launch, and payment handling.
  - Fix: decide whether those docs are current-state docs or target-state specs, then either archive/relabel the larger flow docs or restore the missing runtime behavior.

- [ ] Repair the API docs source-of-truth model.
  - Files: `docs/api/README.md`, `docs/api/overview.md`, `docs/api/current-surface.md`, `openapi/openapi.yaml`
  - Problem: multiple files claim to be canonical, but the “code truth” surface is already missing live mounted routes such as `/devices/stream`, `/subscriptions/me`, and `/servers/{server_id}/peers-live`, plus newer admin/webapp endpoints.
  - Fix: pick one authoritative contract source, generate derived docs from code where possible, and stop labeling stale hand-maintained files as canonical.

- [ ] Update or narrow `docs/codebase-map.md` so it no longer presents stale inventory as precise truth.
  - File: `docs/codebase-map.md`
  - Problem: the router and bot sections omit many currently mounted backend routers and still describe inactive bot handlers as if they define the live product.
  - Fix: either regenerate the map from current entry points or reduce it to a high-level architecture map with explicit scope limits.

- [ ] Fix top-level doc indexes so they stop funneling readers into stale references.
  - Files: `README.md`, `docs/README.md`
  - Problem: the root README and docs index overstate live bot capabilities and point engineers to stale API/bot docs as quick references.
  - Fix: keep top-level docs focused on current runtime behavior and link target-state/spec material separately from operational truth.

- [ ] Consolidate duplicate bot doc narratives.
  - Files: `bot/README.md`, `docs/bot.md`, `docs/bot/README.md`
  - Problem: the repo currently has one bot README that describes a Mini App launcher and another doc cluster that describes a much larger conversational bot, creating conflicting product narratives.
  - Fix: keep one current-state bot entrypoint doc, move speculative or historical material into archived/spec sections, and remove duplicate overview content.

- [ ] Separate “current state,” “target state,” and “archive” docs across the repo.
  - Files: `docs/`, `vpn-suite-specs/`, root strategy/spec markdown
  - Problem: current-operating docs, design proposals, and historical audits are mixed together, so readers cannot tell what is normative versus aspirational.
  - Fix: define doc classes, move speculative design docs into spec folders, and keep operational/current-state docs small and explicit.

- [ ] Add a documentation ownership and update policy for files marked canonical.
  - Files: `docs/README.md`, `CONTRIBUTING.md`, doc-generation/validation scripts
  - Problem: docs that claim authority currently have no ownership or freshness enforcement, so drift is predictable.
  - Fix: define owners, update triggers, and CI expectations for canonical docs.

- [ ] Add a doc inventory with disposition labels.
  - Labels:
    - current
    - spec / target-state
    - archive
    - audit / one-off
  - Problem: the repo has too many Markdown files for readers to infer status from path names alone.
  - Fix: create an index or naming policy so stale design docs stop masquerading as active guidance.

- [ ] Move one-off audit outputs out of the main guidance path.
  - Files: `docs/audits/`, root audit markdown, release audit docs
  - Problem: valuable audit artifacts are mixed in with normative docs and create noise in the main docs surface.
  - Fix: keep them accessible, but clearly separate them from docs that instruct implementation or operations.

- [ ] Reduce duplicated strategy/spec content across root docs and `vpn-suite-specs/`.
  - Problem: strategy and product direction can be repeated in multiple locations and then diverge.
  - Fix: choose where long-lived product specs live and keep other docs as summaries or links.

- [ ] Add doc update tasks to release checklists.
  - Files: release docs, `docs/ops/release-checklist.md`, relevant CI/process docs
  - Problem: docs are currently updated ad hoc, after implementation drift already exists.
  - Fix: make doc updates part of release gating for API, bot, and beta-scope changes.

## Rollout / Migration

- [ ] Add migration plans for every endpoint or route slated for removal/merge.
  - Problem: the TODO identifies cleanup targets, but not how clients move safely.
  - Fix: for each deprecated API or page, define the replacement, telemetry/checks, and removal trigger.

- [ ] Track actual usage before deleting ambiguous endpoints.
  - Targets: compatibility aliases, `wg` routes, live peer endpoints, stream endpoints
  - Problem: code search alone cannot prove that no external or operational clients still depend on them.
  - Fix: add logs/metrics or proxy-level observation before final removal.

- [ ] Add a staged deprecation checklist.
  - Stages:
    - mark deprecated
    - document replacement
    - measure usage
    - notify/remove internal consumers
    - delete route and docs
  - Problem: deprecations currently risk becoming permanent.
  - Fix: use one repeated process for API, bot, frontend routes, and docs.

- [ ] Define rollback expectations for the beta simplification work.
  - Problem: collapsing flows and routes is product-correct, but can create high-risk releases if rollback is undefined.
  - Fix: document what can be feature-flagged, what requires route redirects, and what requires data migration or support messaging.

## Metrics / Validation

- [ ] Define beta success metrics tied to the simplified flow.
  - Metrics:
    - open app -> choose plan
    - choose plan -> payment success
    - payment success -> device issued
    - device issued -> config downloaded
    - config downloaded -> imported/confirmed
  - Problem: without explicit metrics, simplification work can ship without proving it improved the flow.
  - Fix: align telemetry/events with the beta strategy and review them before launch.

- [ ] Define failure metrics and support triggers for the beta flow.
  - Metrics:
    - auth/session failures
    - payment creation failures
    - device issuance failures
    - download-token failures
    - abandoned setup states
  - Problem: beta quality depends as much on failure visibility as on happy-path conversion.
  - Fix: add operational thresholds and support runbook triggers.

- [ ] Verify telemetry coverage for every deprecation and simplification decision.
  - Problem: route/product cleanup decisions need usage evidence and post-change validation.
  - Fix: ensure analytics/events exist before removing or merging meaningful user flows.
