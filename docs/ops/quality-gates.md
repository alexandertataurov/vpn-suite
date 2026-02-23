# Test & Quality Gates (Merge + Release)

These are the non-negotiable commands for merge and release.

## One-command Quality Gate (local / CI-aligned)

```bash
./manage.sh verify
```

Runs (in order): backend ruff check + format, alembic upgrade/downgrade/check, backend pytest, bot pytest, frontend npm ci + lint + typecheck + unit tests + build, `./manage.sh config-validate`. Requires local Postgres and Redis (or CI). Use `VERIFY_SKIP_DB=1` to skip backend migrate/pytest and bot pytest (lint + frontend + config only). For full API smoke + E2E use `./manage.sh smoke-staging` with core stack up and ADMIN_EMAIL/ADMIN_PASSWORD set.

## Merge Gates (every PR)

Backend:
```bash
cd backend
ruff check .
ruff format --check .
pytest -v
python -m alembic upgrade head
python -m alembic downgrade -1
python -m alembic upgrade head
python -m alembic check
```

Frontend:
```bash
cd frontend
npm ci
npm run lint
npm test -- --run
npm run build
npm run test:e2e
```

Compose sanity:
```bash
./manage.sh config-validate
```

Security:
- gitleaks must be clean (CI job `secret-scan`).

## Release Gates (RC)

Definition of Done:
- CI fully green (`backend` + `frontend-checks` + `frontend-e2e` + `secret-scan`).
- `./manage.sh smoke-staging` passes on staging.
- Webhook replay: same `external_id` twice -> both 200; exactly one business-state mutation.
- Rollback docs exist and have been rehearsed once on staging:
  - control-plane deploy rollback
  - bot deploy rollback
  - node-agent rollback
