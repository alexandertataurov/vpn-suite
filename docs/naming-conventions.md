# Doc naming conventions

All markdown files in `docs/` use **kebab-case** for consistency and URL-friendliness. Keep all product docs under `docs/` (e.g. frontend docs in `docs/frontend/`), not in app trees like `frontend/docs/`.

| Pattern | Example |
|---------|---------|
| Specs | `operator-dashboard-spec.md`, `operator-ui-spec.md` |
| Audits | `admin-servers-audit.md`, `cleanup-audit.md` (exception: `API-AUDIT.md`) |
| Runbooks | `amneziawg-obfuscation-runbook.md`, `incident-response-runbook.md` |
| Contracts | `config-generation-contract.md` |
| Guides | `agent-mode-one-server.md`, `operations-guide.md` |
| Security | `hardening.md`, `threat-model.md`, `alert-policy.md` |
| Frontend | `adaptive-ui.md`, `adaptive-ui-test-plan.md`, `ui-techspec.md`, `miniapp-layout-architecture.md`, `navigation-patterns-catalog.md` |
| Bot | `release.md`, `production-plan.md`, `bot-menu-architecture.md` (under `docs/bot/`) |

When adding new docs, follow kebab-case. Prefer lowercase with hyphens; avoid UPPER_SNAKE or PascalCase.
