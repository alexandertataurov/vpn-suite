# Styles

Load order: `index.css` → tokens → theme → layout → shell → content.

| Layer   | Path                | Role |
|---------|---------------------|------|
| tokens  | `tokens/base.css`    | Primitives, semantic vars, consumer-dark, dim, operator, starlink, techspec |
| theme   | `theme/telegram.css`| Telegram Mini-App design system aliases |
| theme   | `theme/consumer.css`| Single source for consumer-dark and consumer-light |
| layout  | `layout/zones.css`  | Zones, safe areas, shell layout vars |
| shell   | `shell/frame.css`   | Header, nav, shell components |
| content | `content/library.css` | Page content structure |

**Canonical content-library spec** (class names, page composition, tokens): [docs/frontend/miniapp-design-system/content-library.md](../../../../docs/frontend/miniapp-design-system/content-library.md).
