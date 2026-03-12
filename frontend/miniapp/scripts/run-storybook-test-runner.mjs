import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const cwd = process.cwd();
const buildDir = path.join(cwd, "storybook-static");
const configDir = path.join(cwd, ".storybook");
const host = "127.0.0.1";
const port = Number(process.env.STORYBOOK_TEST_PORT ?? 6406);
const targetUrl = `http://${host}:${port}`;
const extraArgs = process.argv.slice(2);
const storybookConfigError = "Could not find stories in main.js";
// The standalone Storybook runner currently misreads Storybook 10 metadata in this workspace.
// Keep this script as an explicit probe so the repo can switch over cleanly once upstream support lands.

if (!existsSync(buildDir)) {
  console.error("storybook-static is missing. Run `npm run build-storybook` first.");
  process.exit(1);
}

function cleanupStaleRunnerProcesses() {
  if (process.platform === "win32") return;

  const lsof = spawnSync("lsof", [`-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (lsof.status === 0 && lsof.stdout) {
    for (const pid of lsof.stdout.split("\n").map((value) => value.trim()).filter(Boolean)) {
      spawnSync("kill", ["-TERM", pid], {
        stdio: "ignore",
      });
    }
  }

  spawnSync("pkill", ["-f", "chrome-headless-shell"], {
    stdio: "ignore",
  });
}

async function waitForServerReady() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${targetUrl}/index.json`);
      if (response.ok) return;
    } catch {
      // Retry until the static server comes up.
    }

    await delay(200);
  }

  throw new Error(`Timed out waiting for Storybook static server at ${targetUrl}`);
}

cleanupStaleRunnerProcesses();

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", host, "--directory", buildDir], {
  cwd,
  stdio: "ignore",
});

const cleanup = () => {
  if (!server.killed) {
    server.kill("SIGTERM");
  }
};

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

try {
  await waitForServerReady();

  const result = spawnSync(
    "npm",
    [
      "exec",
      "--",
      "test-storybook",
      "--url",
      targetUrl,
      "--config-dir",
      configDir,
      "--ci",
      "--maxWorkers=1",
      "--includeTags=contract-test",
      "--disable-telemetry",
      ...extraArgs,
    ],
    {
      cwd,
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if ((result.status ?? 1) !== 0 && combinedOutput.includes(storybookConfigError)) {
    console.warn("Storybook test-runner metadata lookup is incompatible with the current Storybook 10 config. Falling back to addon-vitest contract tests.");

    const fallback = spawnSync("node", ["scripts/run-storybook-vitest.mjs", ...extraArgs], {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    cleanup();
    process.exit(fallback.status ?? 1);
  }

  cleanup();
  process.exit(result.status ?? 1);
} catch (error) {
  cleanup();
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
