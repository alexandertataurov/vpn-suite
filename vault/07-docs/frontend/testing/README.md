# Testing

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/testing/frontend-test-matrix|frontend-test-matrix.md]] | Routes × flows × states, E2E specs, gaps |

## Playwright (E2E)

- Install browsers (once per machine): `npx playwright install chromium`
- If the browser fails to launch due to missing OS libraries, install Playwright system deps for your distro (see Playwright docs) and rerun.
