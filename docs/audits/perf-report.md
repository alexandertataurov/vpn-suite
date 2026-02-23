# Performance Report

## Code Splitting

| App | Status | Notes |
|-----|--------|-------|
| Admin | ✓ | All routes lazy-loaded via React.lazy in App.tsx |
| Miniapp | ✓ | All routes lazy-loaded |

## manualChunks (admin vite.config.ts)

| Chunk | Content |
|-------|---------|
| echarts | echarts, echarts-for-react |
| vendor | node_modules (non-echarts) |
| shared | shared package |

## Bundle Size (admin build)

| Chunk | Size (min) | Gzip |
|-------|------------|------|
| echarts | 913 kB | 300 kB |
| vendor | 527 kB | 173 kB |
| shared | 42 kB | 13 kB |
| Servers | 39 kB | 12 kB |
| Telemetry | 41 kB | 11 kB |
| Dashboard | 28 kB | 7 kB |

*echarts chunk >600 kB; warning in build. Consider dynamic import for Telemetry/Dashboard if needed.*

## Virtualization

- VirtualTable (shared) uses @tanstack/react-virtual
- Used on Servers page for large lists

## Memoization

- useMemo/useCallback: audit recommended; avoid premature optimization
- No obvious unnecessary re-renders identified

## Images

- No heavy image assets in frontend; N/A for WebP/lazy-load audit
