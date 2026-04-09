# Storybook Known Issues

## Official test-runner vs Storybook 10 metadata

Current status:
- `apps/miniapp` uses Storybook `10.2.17`
- `@storybook/test-runner` is installed and exposed through `npm run test-storybook:official -w miniapp`
- the standalone runner currently fails while resolving Storybook metadata from `.storybook/main`

Observed failure:

```text
Could not find stories in main.js in "/opt/vpn-suite/apps/miniapp/.storybook"
```

What this means:
- the repo-level Storybook contract setup is correct enough for `storybook build`
- the reduced executable contract suite works through the addon-vitest path
- the standalone official runner is not yet reliable in this workspace/toolchain combination

Current repo policy:
- `npm run test-storybook -w miniapp`
  Required gate. Runs the reduced contract suite.
- `npm run test-storybook:official -w miniapp`
  Exploratory probe. Non-blocking in CI.

Why the fallback exists:
- the repo should keep enforcing Storybook contract coverage now
- waiting for upstream compatibility before enforcing any Storybook tests would reduce coverage immediately

What to revisit later:
1. Re-test the official runner after Storybook / test-runner upgrades.
2. Remove the fallback in `apps/miniapp/scripts/run-storybook-test-runner.mjs` once the official runner resolves `.storybook/main` correctly.
3. Promote `test-storybook:official` to the required CI gate when it passes cleanly on both local and CI workers.
