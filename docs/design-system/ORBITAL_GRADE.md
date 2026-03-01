# Orbital-Grade Design System

## System Manifesto

Orbital-grade UI targets mission-critical control interfaces: cockpit HUDs, ground station consoles, satellite telemetry. Principles:

- **Readability over decoration** — high contrast, monospace data, zero noise
- **Status at a glance** — semantic Badges (nominal/warning/critical), inline sparklines
- **Selection clarity** — 2px left accent bar, no zebra or shadows
- **Token-driven** — hex values live in `data-theme="orbital"`; components use CSS vars

## Tailwind Token Mapping Notes

| Orbital Spec | Token | Value |
|--------------|-------|-------|
| Surface | `--color-surface` | #111111 |
| Row hover | `--color-overlay` | #1A1A1A |
| Header text | `--color-text-secondary` | #A0A0A0 |
| Selection bar | `--color-accent` | #1E6FFF |
| Border radius | `--radius-sm` | 2px |

Orbital theme is set via `html[data-theme="orbital"]` in `tokens.css`.

## Status Table Spec

| Property | Value |
|----------|-------|
| Row height | 42px |
| Headers | Uppercase, #A0A0A0, letter-spacing wider |
| SATELLITE_ID | Monospace, left |
| ORBITAL_VELOCITY | Monospace, right-aligned |
| STATUS | Badge: `online` → nominal, `degraded` → warning, `offline` → critical |
| LATENCY | MiniSparkline (48×20px) |
| Row hover | Background #1A1A1A |
| Row selected | 2px left border #1E6FFF |

Uses `Badge` from `@/design-system/primitives`, `MiniSparkline` from `@/components/servers/MiniSparkline`, `StatusTable.css` in same folder.
