# Primitives

Low-level layout and typography building blocks. No business logic; use design tokens via className/CSS.

**Export order (see `index.ts`):**

| Group | Exports |
|-------|--------|
| **Layout** | Box, Container, Inline, Panel, Stack |
| **Separator** | Divider |
| **Typography** | Text, Heading |

- **Box** — base div with `ds-box`; use for layout or wrapper.
- **Container** — constrained width + padding (`size`, `padding`).
- **Inline** — horizontal Stack (gap/align/wrap).
- **Panel** — surface/outline panel (`variant`, `padding`).
- **Stack** — vertical/horizontal flex with `data-direction`, `data-gap`, `data-align`, `data-justify`.
- **Divider** — horizontal/vertical separator (`orientation`, `tone`).
- **Text** — body/body-sm/meta/caption; **Heading** — h1–h4 levels.

Semantic typography (Display, H1–H3, Body, Caption) lives in **components/typography** and delegates to these primitives.
