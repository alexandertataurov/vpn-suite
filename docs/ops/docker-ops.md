# Docker Ops Runbook

## Safe Cleanup Checklist

Use these commands to reclaim disk space. Run only when safe (see "When NOT to prune" below).

| Command | Reclaims |
|---------|----------|
| `docker system prune -f` | Dangling images, stopped containers, unused networks |
| `docker builder prune -f` | Build cache |
| `docker volume prune -f` | Unused volumes (only when volumes are disposable) |

### Examples

```bash
# Prune dangling images and stopped containers
docker system prune -f

# Prune build cache (speeds up future builds but next build will be slower)
docker builder prune -f

# Prune unused volumes (DANGER: removes data volumes not attached to a container)
docker volume prune -f
```

## When NOT to Prune

- **While builds are running** — can cause cache inconsistency
- **Before backing up volumes** — ensure critical data is backed up first
- **Production during peak** — prefer maintenance windows

## CI Cache Strategy

Use `buildx` with `cache-from` / `cache-to` for faster CI builds:

```bash
docker buildx build \
  --cache-from type=registry,ref=myreg/image:cache \
  --cache-to type=registry,ref=myreg/image:cache,mode=max \
  -t myreg/image:tag .
```

For local/CI without registry cache, BuildKit cache mounts (see Dockerfiles) already speed up `apt`, `pip`, and `pnpm` layers.
