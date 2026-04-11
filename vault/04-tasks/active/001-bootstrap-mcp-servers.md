---
status: todo
agent: cursor
files:
  - mcp-servers/obsidian-mcp/index.ts
  - mcp-servers/filesystem-mcp/index.ts
  - mcp-servers/.env
  - vault/05-journal/2026-04-11-bootstrap-mcp-servers.md
depends: []
---

## Goal

Bootstrap the Obsidian and filesystem MCP toolchain: install dependencies, ensure both servers start cleanly with a clear stdio-ready log line, create `.env`, smoke-test MCP tools, and record a bootstrap report under `vault/05-journal/`.

## Context

The repo includes `mcp-servers/` (TypeScript MCP servers using `@modelcontextprotocol/sdk`, stdio transport). Cursor agents use **obsidian-mcp** (`VAULT_PATH`) and **filesystem-mcp** (`PROJECT_PATH`). The vault root is `vault/` under the project; tasks and journals live under `vault/04-tasks/` and `vault/05-journal/`. This is the first task note; completing it proves `task_next`, tooling, and vault layout work end-to-end.

## Acceptance criteria

1. `npm install` has been run successfully in `./mcp-servers/` (no install errors).
2. Both servers can be started from `./mcp-servers` via `node ./node_modules/ts-node/dist/bin.js --esm <entry>.ts` (or `node dist/.../index.js` after `npm run build`); within a couple of seconds stderr prints exactly `MCP server listening on stdio` (add `console.error` after `server.connect` if missing). Avoid `npx` for local verification (npm root override conflicts). No uncaught exceptions during startup.
3. `mcp-servers/.env` exists, copied from `mcp-servers/.env.example`, with `VAULT_PATH` and `PROJECT_PATH` set to sensible absolute paths for this machine (vault directory and git repo root). The task description must remind the human to adjust if paths differ.
4. Smoke tests via MCP: **vault_list** (obsidian-mcp) returns paths including expected vault folders (e.g. `04-tasks/active`, `05-journal`); **fs_list** (filesystem-mcp) lists entries at the project root and confirms readability.
5. A bootstrap report exists at `vault/05-journal/2026-04-11-bootstrap-mcp-servers.md` with YAML frontmatter (`date`, `task`, `files_changed` or equivalent) and a `## Summary` describing install result, server verification, env paths used, smoke-test results, and any follow-ups.

## Prompt (copy-paste to agent)

You are executing the bootstrap task for this repository’s MCP servers. Work only inside the paths listed in this note’s `files` frontmatter (and create the journal file listed there). Follow `.cursorrules` if present.

**1. Install**

- In a terminal, `cd` to the repository root, then run: `cd mcp-servers && npm install`.
- If install fails, fix only what is in scope (dependencies under `mcp-servers/`) and retry until it succeeds.

**2. Startup message (code change if needed)**

- Open `mcp-servers/obsidian-mcp/index.ts` and `mcp-servers/filesystem-mcp/index.ts`. After `await server.connect(transport)`, there must be exactly: `console.error("MCP server listening on stdio");` on stderr. Add it only if missing (do not duplicate). Do not log secrets.

**3. Verify local start (terminal)**

- From `mcp-servers/`, use **`node`** to invoke the local **ts-node** binary (avoid **`npx`**, which can hit npm `EOVERRIDE` from the monorepo root). Export `VAULT_PATH` and `PROJECT_PATH` as in step 4, then run:

  - `timeout 3s node ./node_modules/ts-node/dist/bin.js --esm ./obsidian-mcp/index.ts`  
  - `timeout 3s node ./node_modules/ts-node/dist/bin.js --esm ./filesystem-mcp/index.ts`

- Optional compiled check: `npm run build` then `timeout 3s node ./dist/obsidian-mcp/index.js` (and filesystem).

- Ensure stderr contains `MCP server listening on stdio` and there is no stack trace before timeout.

**4. `.env`**

- Copy `mcp-servers/.env.example` to `mcp-servers/.env`.
- Set `VAULT_PATH` to the absolute path of this repo’s `vault/` directory and `PROJECT_PATH` to the absolute path of this repository root. Tell the user in one short sentence at the end of your response that they should edit `.env` if their layout differs.

**5. MCP smoke tests**

- Using **obsidian-mcp** tool `vault_list` with no folder or with folder `""` / root as documented, confirm the result includes markdown paths that show the vault structure (at minimum something under `04-tasks/` and `05-journal/`).
- Using **filesystem-mcp** tool `fs_list`, pass `path` as `""` or `.` per tool contract and a sensible default glob if required; confirm you see project root entries (e.g. `mcp-servers`, `package.json`, or `pnpm-lock.yaml`).
- If a tool is unavailable in your session, state that explicitly in the journal and record what you verified in the terminal instead.

**6. Journal report**

- Create `vault/05-journal/2026-04-11-bootstrap-mcp-servers.md` with YAML frontmatter including `date: 2026-04-11`, `task: Bootstrap MCP servers`, and `files_changed` listing every file you created or modified.
- Body: `## Summary` with 3–5 sentences covering npm install, server stderr line verification, `.env` paths, MCP smoke results, and open issues.

**7. Done**

- Do not call `task_done` unless your workflow requires it after the journal exists; if you do, use the vault-relative path to this task file: `04-tasks/active/001-bootstrap-mcp-servers.md`.
