# Observability — Legacy Removal Plan

**Phase 4 deliverable.** Remove only after new pipeline verified. Order by risk (lowest first).

---

## 1. Inventory service (low risk)

| Item | Evidence | Action |
|------|----------|--------|
| **inventory** container | [`docker-compose.observability.yml`](../../docker-compose.observability.yml) L47–68, `INVENTORY_DISABLED=1` | Remove service block; remove from manage.sh up-monitoring list (if present). |
| `monitoring/inventory/` | [`generate_inventory.py`](../../monitoring/inventory/generate_inventory.py) | Keep for now (used by scripts/inventory); or delete if no callers. |

**Verification:** `grep -r "inventory" --include="*.yml" --include="*.sh"`; ensure no references after removal.

---

## 2. Correlation engine stub (low risk)

| Item | Evidence | Action |
|------|----------|--------|
| **correlation_engine** | [`correlation_engine.py`](../../ops/discovery/correlation_engine.py): `correlate()` returns `[]` | Either implement or remove call from [`__main__.py`](../../ops/discovery/__main__.py) L147; mapping.json can be omitted. |

**Verification:** discovery still produces targets.json; mapping.json unused by Prometheus.

---

## 3. Unused / obsolete config references

| Item | Evidence | Action |
|------|----------|--------|
| **ALERTS volume** | [`docker-compose.observability.yml`](../../docker-compose.observability.yml) L43: `./ALERTS:/etc/prometheus/alerts` | Verify ./ALERTS exists; if not, remove volume or create stub dir. |

---

## 4. Dead endpoints

None identified. `/metrics-old`, `/stats` (standalone) not present. `referral/stats` is a valid API.

---

## 5. Unused env vars

| Var | Evidence | Action |
|-----|----------|--------|
| `INVENTORY_DISABLED` | Used only by inventory service | Remove when inventory removed. |

---

## 6. Obsolete docs

| Doc | Action |
|-----|--------|
| Duplicate or superseded observability docs | After consolidation, mark deprecated or merge into current-state.md / target-architecture.md. |

---

## 7. Removal order

1. Remove ALERTS volume if ./ALERTS missing (or create dir).
2. Remove inventory service from docker-compose.observability.yml.
3. Remove correlation_engine call if mapping.json unused.
4. Update manage.sh if it referenced inventory.
5. Add CHANGELOG migration note.

---

## 8. Acceptance

- [ ] No references to old pipeline (`grep` proof)
- [ ] Compose starts cleanly
- [ ] Dashboard still functional
- [ ] Observability stack still receiving data
