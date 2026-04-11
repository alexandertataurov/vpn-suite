# Storybook

| Doc | Purpose |
|-----|---------|
| [[07-docs/storybook-ai-contract|../../storybook-ai-contract.md]] | Repo-level UI contract for Storybook and AI agents |
| [[07-docs/ai-ui-workflow|../../ai-ui-workflow.md]] | Required UI workflow for AI and engineers |
| [[07-docs/frontend/storybook/structure|structure.md]] | IA, sidebar hierarchy |
| [[07-docs/frontend/storybook/conventions|conventions.md]] | Story conventions (summary) |
| [[07-docs/frontend/storybook/STORY-DOCUMENTATION-LAYERS|STORY-DOCUMENTATION-LAYERS.md]] | **Layer 1–6 spec:** component docs, story descriptions, story sets, naming, argTypes, data |
| [[07-docs/frontend/storybook/guardrails|guardrails.md]] | Guardrails |
| [audit.md](audit.md) | Storybook audit |
| [[07-docs/frontend/storybook/known-issues|known-issues.md]] | Current Storybook runner compatibility gaps |

## Contract Test Commands

- `pnpm run storybook:contract:miniapp`
  Verifies that the required executable Storybook contract stories and `contract-test` tags are present.
- `pnpm run test-storybook:miniapp`
  Runs the enforced reduced Storybook contract suite.
- `pnpm run test-storybook:official:miniapp`
  Attempts the official `@storybook/test-runner` path first. This is currently exploratory because the installed runner does not resolve Storybook 10 metadata correctly in this workspace.

CI behavior:
- `ui-contract` enforces `test-storybook`
- the workflow also runs `test-storybook:official` as a non-blocking probe so runner compatibility drift is visible without breaking merges
