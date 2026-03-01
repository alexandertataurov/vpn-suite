# Phase 6 — DB Migration Check

**Deliverable:** DB migration safety report.

---

## 1. Migrations in Scope

| Revision | Action | Risk |
|----------|--------|------|
| 035 | DROP COLUMN devices.outline_key_id | High (irreversible; data lost) |
| 036 | DROP COLUMN servers.integration_type | High (irreversible; data lost) |

---

## 2. Migration Details

### 035 — devices.outline_key_id

- Upgrade: op.drop_column("devices", "outline_key_id")
- Downgrade: Adds column back nullable; data in dropped column is lost.
- Context: Schema cleanup (legacy column).

### 036 — servers.integration_type

- Upgrade: op.drop_column("servers", "integration_type")
- Downgrade: Adds column back with server_default="awg"; data lost.
- Context: Schema cleanup (legacy column).

---

## 3. Pre-Migration Checklist

- [ ] No remaining references to outline_key_id in code
- [ ] No remaining references to integration_type in code
- [ ] No Outline/legacy API in use (removed)
- [ ] Backup DB before migration
- [ ] Test migration on staging
- [ ] Test downgrade/upgrade cycle (alembic downgrade -1; alembic upgrade head)

---

## 4. Rollback Plan

1. Downgrade: alembic downgrade -1 or -2.
2. Columns reappear with defaults; original values not recoverable.
3. Restore from backup if needed.

---

## 5. Summary

| Check | Status |
|-------|--------|
| Migrations reversible | Yes (structure only; data lost) |
| Code references removed | Yes |
| Backup recommended | Yes |
| Staging test | Recommended |
