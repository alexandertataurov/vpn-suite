import { spawnSync } from "node:child_process";
import path from "node:path";
import { STORYBOOK_CONTRACT_STORIES } from "./storybook-contract-config.mjs";

const cwd = process.cwd();
const projectName = `storybook:${path.join(cwd, ".storybook")}`;
const extraArgs = process.argv.slice(2);
const storyFiles = extraArgs.length > 0 ? extraArgs : STORYBOOK_CONTRACT_STORIES;

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

cleanupStaleBrowserWorkers();

for (const storyFile of storyFiles) {
  const result = spawnSync(
    "npm",
    ["exec", "--", "vitest", "run", "--project", projectName, storyFile],
    {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);
