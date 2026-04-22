import { spawnSync } from "node:child_process";
import path from "node:path";
import { STORYBOOK_CONTRACT_STORIES } from "./storybook-contract-config.mjs";
import { buildPlaywrightEnv, ensurePlaywrightLibraries } from "./playwright-env.mjs";

const cwd = process.cwd();
const projectName = `storybook:${path.join(cwd, ".storybook")}`;
const extraArgs = process.argv.slice(2);
const storyFiles = extraArgs.length > 0 ? extraArgs : STORYBOOK_CONTRACT_STORIES;

function buildStorybookTestEnv() {
  return buildPlaywrightEnv({ cwd });
}

function cleanupStaleBrowserWorkers() {
  if (process.platform === "win32") return;

  const cleanupPatterns = [
    "storybook dev -p 0 --ci --no-open",
    "chrome-headless-shell",
  ];

  for (const pattern of cleanupPatterns) {
    spawnSync("pkill", ["-f", pattern], {
      stdio: "ignore",
    });
  }
}

ensurePlaywrightLibraries({ cwd });
cleanupStaleBrowserWorkers();

for (const storyFile of storyFiles) {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "--project", projectName, storyFile],
    {
      cwd,
      env: buildStorybookTestEnv(),
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);
