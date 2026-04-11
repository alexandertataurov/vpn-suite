# Postgres Safeguards

Prevent accidental DB loss and data corruption.

## Never run

- `docker compose down -v` — removes volumes, wipes DB
- `docker volume rm vpn-suite_postgres_data`
- `docker system prune -v` — prunes unused volumes

## Before risky operations

- `rebuild-restart` and `down-core` auto-run `backup-db` unless `BACKUP_SKIP=1`
- Set `BACKUP_SKIP=1` only when backup is impossible or already done

## Volume protection

- `postgres_data` has explicit name `vpn-suite_postgres_data`

## Safe restart path

Use `./manage.sh restart-admin` for admin-only rebuilds — never touches postgres.
