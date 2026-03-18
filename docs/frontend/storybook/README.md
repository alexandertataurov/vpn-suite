# Storybook

| Doc | Purpose |
|-----|---------|
| [../../storybook-ai-contract.md](../../storybook-ai-contract.md) | Repo-level UI contract for Storybook and AI agents |
| [../../ai-ui-workflow.md](../../ai-ui-workflow.md) | Required UI workflow for AI and engineers |
| [structure.md](structure.md) | IA, sidebar hierarchy |
| [conventions.md](conventions.md) | Story conventions (summary) |
| [STORY-DOCUMENTATION-LAYERS.md](STORY-DOCUMENTATION-LAYERS.md) | **Layer 1–6 spec:** component docs, story descriptions, story sets, naming, argTypes, data |
| [guardrails.md](guardrails.md) | Guardrails |
| [audit.md](audit.md) | Storybook audit |
| [known-issues.md](known-issues.md) | Current Storybook runner compatibility gaps |

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
