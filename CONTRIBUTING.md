# Contributing

## Design System Contract

These rules are enforced by CI. PRs that violate them will not merge.

**Two apps:** **Miniapp** (Telegram Mini App) uses `frontend/miniapp` tokens and design-system UI. **Admin** uses its own design system at `frontend/admin/src/design-system/` (tokens in `tokens/tokens.css`, primitives, stories in `design-system/stories/` and `.storybook/data`). The following tokens/components/pages rules apply to the miniapp; for admin, use the admin design-system and the same no-hardcoded-values discipline.

### Tokens (miniapp)
- All design values (color, spacing, type, motion, z-index) live in
  `frontend/miniapp/src/design-system/styles/tokens/base.css` and `theme/consumer.css` — the single source of truth
- **Amnezia Mini App spec**: `docs/frontend/design/amnezia-miniapp-design-guidelines.md` — canonical UI spec for consumer miniapp (tokens, components, screen states)
- No value is defined anywhere else
- To add a token: update tokens.css, follow the existing naming scheme, get reviewed

### Components (miniapp)
- Need a UI pattern? Check design-system and components first
- If it exists: use it — never rebuild inline
- If it doesn't exist: build it in `frontend/miniapp/src/design-system` or `frontend/miniapp/src/components`, not in a feature folder
- Feature folders contain data-fetching and composition only — never style primitives

### Icons (miniapp)
- Always: `import { IconName } from "@/lib/icons"` or `@/design-system/icons`
- Never: `import { LucideIcon } from "lucide-react"` in a component or page
- To add an icon: add alias to `frontend/miniapp/src/lib/icons.ts` first

### Status colors (miniapp)
- Always: `STATUS_TOKENS[variant].color`
- Never: `if (status === "ok") return "#22C55E"`

### Pages (miniapp)
- Every page uses `MiniappLayout`/`PageScaffold` — no exceptions
- Every page handles all three data states: loading → error → populated
- Page padding comes from shared layout components — never set manually

### Storybook (admin)

- Stories live under `frontend/admin/src/design-system/stories/` (and page-level stories where used)
- **Documentation layers:** Follow [docs/frontend/storybook/STORY-DOCUMENTATION-LAYERS.md](docs/frontend/storybook/STORY-DOCUMENTATION-LAYERS.md) — Layer 1 (component description), Layer 2 (story description template), Layer 3 (story sets), Layer 5 (naming: AllVariants, DarkModeVariant, InContext, etc.), Layer 6 (argTypes with description, control, table, options)
- Shared story data: `frontend/admin/.storybook/data` — use it instead of inline fixtures where possible
- Conventions summary: [docs/frontend/storybook/conventions.md](docs/frontend/storybook/conventions.md)

### PR checklist (reviewer must verify)
- [ ] Zero hardcoded hex/rgb colors added
- [ ] Zero inline `style={{ }}` objects added
- [ ] Zero direct lucide-react imports added
- [ ] Zero new components that duplicate existing design-system components
- [ ] Page uses correct layout (Miniapp: MiniappLayout; Admin: design-system/layout)
- [ ] All states handled: loading, error, empty, populated
- [ ] `pnpm -C frontend/miniapp run typecheck` passes clean
