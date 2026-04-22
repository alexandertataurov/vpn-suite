import { spawnSync } from "node:child_process";
import { ensurePlaywrightLibraries, buildPlaywrightEnv } from "./playwright-env.mjs";

const cwd = process.cwd();
const extraArgs = process.argv.slice(2);

if (!["install", "install-deps"].includes(extraArgs[0] ?? "")) {
  ensurePlaywrightLibraries({ cwd });
}

const result = spawnSync("pnpm", ["exec", "playwright", ...extraArgs], {
  cwd,
  env: buildPlaywrightEnv({ cwd }),
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
