# AI UI Workflow

When changing UI, always follow this order:

1. Find the existing Storybook story for the component or pattern.
2. If no story exists, create it before editing any page.
3. Prefer editing primitives, patterns, or layouts over page-local markup.
4. Update or add stories for all changed states.
5. Add or update `play` functions for interactions.
6. Ensure stories use realistic miniapp copy and data.
7. Run Storybook tests.
8. Run visual regression checks.
9. In the final report, list:
   - files changed
   - stories added or updated
   - states covered
   - tests added or updated
   - visual impact

Miniapp-specific rules:
- Use `frontend/miniapp/src/storybook/fixtures/**` and `frontend/miniapp/src/storybook/factories/**` for story data.
- Use `frontend/miniapp/src/storybook/decorators/withMiniAppShell.tsx` for Telegram-safe viewport framing instead of ad hoc wrappers.
- Treat Storybook stories as the contract before touching `frontend/miniapp/src/pages/**`.
- Use `npm run test-storybook -w miniapp` as the required Storybook contract gate. Use `npm run test-storybook:official -w miniapp` only as a compatibility probe until the standalone runner issue is resolved.
