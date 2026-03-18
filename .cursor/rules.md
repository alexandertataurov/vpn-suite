# Cursor rules — VPN Suite monorepo

**Project context**: Full-stack monorepo — Docker Compose infra, GitHub Actions CI, self-hosted staging. Backend: Python 3.12, FastAPI, SQLAlchemy async, Alembic, Redis, PostgreSQL. Frontend: React 18, TypeScript, Vite workspaces (admin, miniapp, shared). Bot: Python 3.12 + aiogram. Linters: ruff, eslint + prettier, mypy.

---

## Multi-agent workflow (skills and subagents)

Follow the workflow in **PROMPT.md**. Summary:

### Skills to apply

- **team-contract**: Single owner per change; small deployable increments; manual test checklist + rollback note per increment; cross-boundary work = TODO only, no implementation.
- **system-architect**: Before large changes — RFC, Go/No-Go, rollback/observability/API plans, task breakdown.
- **observability-engineer**: For telemetry — metrics, logs, correlation IDs, SLOs, runbook snippets.
- **vpn-suite**: For project layout, services, Docker Compose, deployment, and conventions.
- **frontend-engineer**: For UI, React/TypeScript, and frontend work.

### Subagents to invoke

- **system-architect-gatekeeper**: Review and architecture note before non-trivial or cross-boundary changes.
- **orchestrator**: Classify scope, enforce boundaries, create handoff notes for cross-boundary work.
- **frontend-engineer**: Frontend-only changes.
- **backend-engineer**: Backend-only changes.
- **observability-engineer**: Metrics, logs, dashboards, alerts.
- **ci-watcher** (if available): CI/tooling, workflows, lint config.

### Execution order

1. **For any change**: Apply team-contract first (single owner, small increments, test checklist, rollback note).
2. **For large or cross-boundary changes**: Run system-architect-gatekeeper, then orchestrator, then implement via the relevant domain subagent(s).
3. **After implementation**: Run observability-engineer for telemetry when the change affects production behavior.
4. Keep increments small; each increment must have a manual test checklist.

**Rule**: Do not implement across boundaries (e.g. backend + frontend in one step). Use orchestrator handoff and separate subagent runs. When in doubt, invoke system-architect-gatekeeper before making non-trivial changes.

### Remote / resource-constrained VPS (Cursor Remote, Antigravity)

- **Do not run** `full:check`, `frontend:check`, or `npm test` / `pnpm test` on resource-constrained VPS. These spawn vitest+storybook+chromium and can exhaust RAM.
- **Use instead**: `pnpm run typecheck`, `pnpm run lint`, `pnpm run guardrails`. Unit tests: `pnpm --filter miniapp test` (unit only). Full tests: run in CI or on a dedicated machine.
- **stop.sh** runs typecheck+lint only; heavy tests are excluded by design.

---

## Cross-cutting rules

- **No debug logging in committed code**: Do not leave `console.log` or `print()` in code that is committed. Use the project logger (backend: structlog; frontend: project logger util). Remove or replace debug statements before committing.
- **No secrets**: Do not hardcode API keys, passwords, tokens, or other secrets in any file. Use environment variables (and document them where appropriate).
- **Migrations**: Every new database migration must include both `upgrade()` and `downgrade()`. A bare `pass` in `downgrade()` is not acceptable without a comment explaining irreversibility.
- **GitHub Actions**: New workflow steps that run multi-line shell commands must use `set -euo pipefail` at the top of the `run:` block so failures and unset variables are caught.
- **CHANGELOG.md**: Update constantly. When you add, change, deprecate, remove, or fix something notable, add an entry under `## [Unreleased]` in the appropriate subsection. Follow Keep a Changelog; one short line per item.
- **README.md**: Update constantly. When you add or change features, CLI commands (`manage.sh`), configuration variables, or setup steps, update the corresponding section.

### No magic numbers

**Scope**: all files  
**Rule**: Numeric literals other than `0` and `1` must be assigned to named constants at module top or in a constants file.  
**Correct**: `MAX_RETRIES = 3` then `for _ in range(MAX_RETRIES)`  
**Incorrect**: `for _ in range(3)`  
**Why**: Single source of truth and easier tuning.

### PR scope discipline

**Scope**: all files  
**Rule**: Limit edits to files directly related to the task. Mention unrelated issues as comments, never fix them in the same edit.  
**Correct**: Change only the endpoint and its test when adding a query param.  
**Incorrect**: "While here" fixing lint in three other files.  
**Why**: Reviewability and rollback clarity.

### Environment parity

**Scope**: `**/*.py`, `**/*.ts`, `**/*.tsx`  
**Rule**: Environment-dependent behaviour must be gated on env variables only. Never branch on `if env == "prod"`. Use a `settings` object (backend) or `import.meta.env` (frontend).  
**Correct**: `if settings.debug:` or `if import.meta.env.DEV`  
**Incorrect**: `if os.getenv("ENV") == "production":`  
**Why**: Consistent configuration and testability.

### Deprecation flagging

**Scope**: all files  
**Rule**: If using a `@deprecated` symbol, flag it and propose the replacement. Never silently perpetuate deprecated patterns.  
**Correct**: "Using deprecated `old_helper`; replace with `new_helper` in follow-up."  
**Incorrect**: Adding more call sites to `old_helper` without comment.  
**Why**: Clear path to removal.

---

## Backend rules

- **Type annotations**: All new functions and methods must have mypy-compatible type annotations (parameters and return type). Do not use `Any` unless explicitly commented with a reason.
- **FastAPI + OpenAPI**: When you add or change FastAPI route handlers, run the OpenAPI export and update the committed spec. After adding routes, run `python scripts/export_openapi.py` from `backend/`. Commit changes to `openapi/openapi.json` and optionally `openapi/openapi.yaml`.
- **Alembic**: New Alembic migrations must be followed by `alembic check` (from `backend/`) to confirm no un-generated schema changes remain. Do not hand-edit migration files to fix schema drift; create a new revision instead.
- **SQLAlchemy**: Use the async session pattern only. Use `async with session` / `await session.execute(select(...))`. Forbidden: synchronous `session.query()`.
- **Vulture-clean**: Do not leave unused functions, variables, or imports. Remove them rather than commenting out.
- **pip-audit**: Do not add new dependencies without checking for known CVEs first (e.g. run `pip-audit`).

### Async session consistency

**Scope**: `backend/**/*.py`, `**/alembic/**`  
**Rule**: Every DB call uses `await` inside `async def` with `AsyncSession`. Never use sync `session.query()` or wrap with `asyncio.run()`.  
**Correct**: `await session.execute(select(User).where(User.id == id))`  
**Incorrect**: `session.query(User).filter(User.id == id).first()` or `asyncio.run(...)` in a route  
**Why**: Prevents blocking the event loop and keeps one async model.

### Pydantic validation boundary

**Scope**: `backend/**/*.py`  
**Rule**: All incoming data goes through a Pydantic v2 model before touching ORM constructors. No `request.json()` parsed manually.  
**Correct**: `body: CreateUserBody = await request.json()` then validate via Pydantic; use `body.name` etc.  
**Incorrect**: `data = await request.json(); User(name=data["name"])`  
**Why**: Single validation and serialization boundary.

### HTTPException only

**Scope**: `backend/**/*.py`  
**Rule**: HTTP errors are raised as `HTTPException(status_code=..., detail=...)`. No bare `raise Exception(...)` in route handlers.  
**Correct**: `raise HTTPException(status_code=404, detail="User not found")`  
**Incorrect**: `raise ValueError("not found")` in a route  
**Why**: Consistent API error contract and OpenAPI error responses.

### structlog only

**Scope**: `backend/**/*.py`  
**Rule**: Use `structlog.get_logger()` exclusively. No `print()`, no `logging.getLogger()`. Bind context keys via `log.bind(user_id=..., request_id=...)`.  
**Correct**: `log = structlog.get_logger(); log.info("created", user_id=user.id)`  
**Incorrect**: `print(x)`, `logging.getLogger(__name__).info(...)`  
**Why**: Structured logs and correlation.

### Redis key namespacing

**Scope**: `backend/**/*.py`  
**Rule**: All Redis keys use a prefix constant from `app/cache/keys.py` (or project equivalent). No bare string keys like `"user:123"` in business logic.  
**Correct**: `cache_key = f"{keys.USER_PREFIX}:{user_id}"`  
**Incorrect**: `redis.get("user:123")`  
**Why**: Avoid key collisions and enable key policies.

### FastAPI dependency placement

**Scope**: `backend/**/*.py`  
**Rule**: `Depends(...)` factories shared across multiple routers live in `app/dependencies.py` (or project equivalent), not inline in routers.  
**Correct**: `def get_db(): ...` in `dependencies.py`; in router `db: AsyncSession = Depends(get_db)`  
**Incorrect**: Defining `get_db` inside the router module when used elsewhere  
**Why**: Reuse and testability.

---

## Frontend rules

- **No hardcoded hex colors**: Do not use `#rrggbb` or `#rgb` in TSX, TS, or CSS. Use CSS variables from the token file only.
- **No inline styles**: Do not use `style={{}}` in JSX. Use Tailwind utility classes or CSS modules.
- **Miniapp icons**: In `frontend/miniapp/src`, do not import directly from `lucide-react`. Import only from `@/lib/icons` or `@/design-system/icons`.
- **No circular imports**: If adding a new import would create a cycle, restructure (e.g. move shared types to a separate file) instead of adding the import.
- **Exports**: Every new exported symbol (component, hook, util) must be imported somewhere, or have a JSDoc comment explaining it is a public API.
- **API calls**: New API calls must use the existing typed API client. No raw `fetch()` or `axios` calls outside the client layer.
- **Accessibility**: Every interactive element must have an accessible label (`aria-label`, `aria-labelledby`, or visible text). Images must have `alt`.
- **Design system**: Any `var(--*)` must be defined in the project's single token file. Do not add a second `:root` block. Tailwind must use configured token aliases.

### React Query for server state

**Scope**: `frontend/**/*.ts`, `frontend/**/*.tsx`  
**Rule**: All server state via `useQuery`/`useMutation`. No `useEffect` + `useState` for data fetching. Mutations call `queryClient.invalidateQueries` on success.  
**Correct**: `const { data } = useQuery({ queryKey: [...], queryFn }); mutation.mutate(..., { onSuccess: () => queryClient.invalidateQueries(...) })`  
**Incorrect**: `useEffect(() => { fetch(...).then(setData); }, []);`  
**Why**: Caching, deduplication, and consistent loading/error state.

### 200-line component limit

**Scope**: `frontend/**/*.tsx`  
**Rule**: If an edit pushes a file over 200 lines, split first and state the split in the response.  
**Correct**: Extract subcomponents or hooks into separate files before adding more logic.  
**Incorrect**: Adding 50 lines to a 180-line component without splitting.  
**Why**: Readability and maintainability.

### Zod + react-hook-form

**Scope**: `frontend/**/*.ts`, `frontend/**/*.tsx`  
**Rule**: All forms use `react-hook-form` with a `zod` resolver. No controlled `useState` forms. Schema in a sibling `*.schema.ts` file.  
**Correct**: `useForm({ resolver: zodResolver(MySchema) });` and `MyForm.schema.ts`  
**Incorrect**: `const [name, setName] = useState("");` for form fields  
**Why**: Validation and form state in one place.

### Error boundary requirement

**Scope**: `frontend/**/*.tsx`  
**Rule**: Every new page-level component must have an `ErrorBoundary` at or above it in the router tree.  
**Correct**: `<Route path="/devices" element={<ErrorBoundary><DevicesPage /></ErrorBoundary>} />`  
**Incorrect**: New page route with no ErrorBoundary in the tree above it  
**Why**: Graceful failure and recovery.

### Storybook for shared components

**Scope**: `frontend/shared/**/*.tsx`  
**Rule**: Every new component added to `shared/` gets a `*.stories.tsx` with at least a `Default` variant created in the same edit.  
**Correct**: Add `Button.tsx` and `Button.stories.tsx` with `Default` in one PR.  
**Incorrect**: Adding only `Button.tsx` to shared  
**Why**: Documentation and regression safety.

### No raw fetch

**Scope**: `frontend/**/*.ts`, `frontend/**/*.tsx`  
**Rule**: No `fetch()` or `axios` outside the typed API client layer.  
**Correct**: Call `apiClient.getUsers()` or equivalent from the project API layer.  
**Incorrect**: `fetch("/api/users")` in a component  
**Why**: Typing, base URL, and auth in one place.

---

## MCP Tool Usage

These rules govern AI behaviour when any MCP server is available.
Safety > speed. A confirmed action is always preferred over a fast irreversible one.

### General rules (all MCP servers)

- Before calling any MCP tool, state: which tool, which arguments, and why.
- Never chain MCP calls that together form a destructive or irreversible operation
  without an explicit user confirmation checkpoint between each step.
- If an MCP call returns an error, show the raw error and ask the user how to
  proceed. Never silently retry with modified parameters.
- Never use any MCP server to read, log, or transmit secrets, tokens, API keys,
  or credentials — even to another tool in the same session.
- If uncertain whether a tool call is destructive, ask before calling it.
  Default posture: do NOT call it.

---

### filesystem (scope: /opt/vpn-suite only)

**Allowed reads:** any file within `/opt/vpn-suite` for context.
**Allowed writes (no confirmation needed):** source files in `backend/`, `frontend/`,
  `bot/`, `scripts/` as part of a coding task explicitly requested by the user.
**Allowed writes (requires confirmation):** show the full path and new content,
  wait for user to reply "confirm write [filename]" before writing to:
  - `alembic/versions/*.py`
  - `frontend/shared/src/styles/tokens.css`
  - `openapi.json`
  - `docker-compose*.yml`
**Never write or delete:**
  - `.env`, `.env.*` — under any circumstances
  - Any file outside `/opt/vpn-suite`
**Never read aloud:** contents of `.env*` files, even if asked.
**Confirmation phrase:** "confirm write [filename]"

---

### memory

**Purpose:** persist decisions, architectural context, and open questions across
  sessions so the AI does not re-derive them every time.
**Allowed stores:** architectural decisions, agreed patterns, known gotchas,
  open TODOs, per-module ownership notes.
**Never store in memory:**
  - Secrets, tokens, passwords, or credentials of any kind
  - PII (user emails, names, IDs from actual production data)
  - Temporary debugging notes (clean these up after the session)
**Memory hygiene:** when a stored decision is superseded, explicitly delete the
  old entry before storing the new one. Never accumulate contradictory notes.
**On conflict:** if a memory entry contradicts the current codebase, flag the
  conflict to the user and ask which is authoritative before proceeding.

---

### sequential-thinking

**Purpose:** use for complex, multi-step reasoning tasks — architecture decisions,
  debugging sequences, migration planning, refactor strategies.
**When to invoke:** explicitly prefer sequential-thinking over direct answers when:
  - A task touches more than 3 files
  - A task involves a database migration
  - A task changes a public API surface
  - A debugging problem has more than one plausible root cause
**Output discipline:** after completing a sequential-thinking chain, summarise the
  conclusion in 3–5 bullet points before writing any code. Do not start coding
  until the reasoning summary is confirmed by the user on complex tasks.
**Never use for:** simple lookups, single-file edits, formatting changes.

---

### context7 (library documentation)

**Purpose:** fetch up-to-date, version-specific docs for FastAPI, SQLAlchemy,
  Pydantic, React, Vite, Tailwind, aiogram, and other dependencies.
**Always use context7 before:**
  - Implementing a pattern you haven't used before in this codebase
  - Adding a new dependency
  - Writing a migration for a schema change
  - Using any API that may have changed between major versions
**Never use context7 to:**
  - Look up internal project conventions (read the codebase directly instead)
  - Verify whether a secret or credential is valid
  - Replace reading the actual installed package source when debugging
**Result handling:** treat context7 output as trusted documentation but verify
  version numbers match the versions in `requirements.txt` / `package.json`
  before applying patterns. Flag any mismatch to the user.
**Rate discipline:** resolve a question in ≤ 2 context7 calls. If unresolved,
  tell the user and ask for clarification.

---

### git (local repo operations)

**Purpose:** structured branch/commit/diff/log access. Use for reasoning about what changed, preparing commit messages, reviewing diffs before applying patches.
**Never use for:** destructive operations (force push, delete branch) without explicit user confirmation. Do not commit or push on behalf of the user unless the user has explicitly requested it and confirmed.

---

### github (PR and issue integration)

**Purpose:** read issues and PRs for context, check CI status, link commits to issues. Do not create or update PRs/issues unless the user has requested it and provided a PAT with write scope.
**Never use for:** reading or transmitting tokens; never log or echo the PAT.

---

### postgres (local dev database only)

**Purpose:** inspect table schemas, column types, indexes, constraints while writing migrations or debugging queries. Read-only use.
**Never:** point at staging or production. Connection string must be localhost only. Never run destructive SQL (DROP, TRUNCATE) without explicit user confirmation.

---

### redis (local dev only)

**Purpose:** inspect Redis key patterns, TTLs, values when debugging caching or designing key namespaces. Local dev only.
**Never:** point at staging or production. Connection must be localhost only. Never FLUSHDB/FLUSHALL without explicit user confirmation.
