import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function dedupePaths(paths) {
  const seen = new Set();
  const deduped = [];
  for (const value of paths) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    deduped.push(value);
  }
  return deduped;
}

function getUserPlaywrightLibraryRoot() {
  return path.join(os.homedir(), ".local", "pwlibs");
}

function getRepoPlaywrightLibraryDirs(cwd) {
  return [
    path.join(cwd, ".cache", "playwright-libs", "root", "usr", "lib", "x86_64-linux-gnu"),
    path.join(cwd, ".cache", "playwright-libs", "root", "lib", "x86_64-linux-gnu"),
  ];
}

function getLocalPlaywrightLibraryDirs(cwd) {
  return [
    path.join(getUserPlaywrightLibraryRoot(), "usr", "lib", "x86_64-linux-gnu"),
    ...getRepoPlaywrightLibraryDirs(cwd),
  ].filter((dir) => fs.existsSync(dir));
}

function hasRequiredChromiumLibrary(dirs) {
  return dirs.some((dir) => fs.existsSync(path.join(dir, "libnspr4.so")));
}

function parsePlaywrightDeps(output) {
  const match = output.match(/apt-get install -y --no-install-recommends ([^"]+)/);
  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(/\s+/)
    .map((pkg) => pkg.trim())
    .filter((pkg) => pkg.length > 0 && pkg.startsWith("lib"));
}

export function buildPlaywrightEnv({ cwd = process.cwd(), env = process.env } = {}) {
  const localLibraryDirs = getLocalPlaywrightLibraryDirs(cwd);
  if (localLibraryDirs.length === 0) {
    return { ...env };
  }

  const currentLibraryPath = env.LD_LIBRARY_PATH ? env.LD_LIBRARY_PATH.split(":") : [];
  const mergedLibraryPath = dedupePaths([...localLibraryDirs, ...currentLibraryPath]).join(":");

  return {
    ...env,
    LD_LIBRARY_PATH: mergedLibraryPath,
  };
}

export function ensurePlaywrightLibraries({ cwd = process.cwd(), env = process.env } = {}) {
  if (process.platform !== "linux" || env.CI === "1") {
    return null;
  }

  const existingDirs = getLocalPlaywrightLibraryDirs(cwd);
  if (hasRequiredChromiumLibrary(existingDirs)) {
    return existingDirs[0] ?? null;
  }

  const dryRun = spawnSync(
    "pnpm",
    ["exec", "playwright", "install-deps", "chromium", "--dry-run"],
    {
      cwd,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      shell: false,
    },
  );

  if ((dryRun.status ?? 1) !== 0) {
    throw new Error(
      `Unable to inspect Playwright dependencies.\n${dryRun.stderr || dryRun.stdout || "No output returned."}`,
    );
  }

  const packages = parsePlaywrightDeps(`${dryRun.stdout ?? ""}\n${dryRun.stderr ?? ""}`);
  if (packages.length === 0) {
    throw new Error("Playwright dependency bootstrap could not determine the required library packages.");
  }

  const userLibraryRoot = getUserPlaywrightLibraryRoot();
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-deps-"));
  fs.mkdirSync(userLibraryRoot, { recursive: true });

  try {
    console.error("Bootstrapping Playwright shared libraries into ~/.local/pwlibs...");

    for (const pkg of packages) {
      const download = spawnSync("apt-get", ["download", pkg], {
        cwd: downloadDir,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        shell: false,
      });

      if ((download.status ?? 1) !== 0) {
        console.error(download.stderr || download.stdout || `Failed to download ${pkg}`);
      }
    }

    const debFiles = fs
      .readdirSync(downloadDir)
      .filter((file) => file.endsWith(".deb"))
      .map((file) => path.join(downloadDir, file));

    for (const debFile of debFiles) {
      const extract = spawnSync("dpkg-deb", ["-x", debFile, userLibraryRoot], {
        cwd: downloadDir,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        shell: false,
      });

      if ((extract.status ?? 1) !== 0) {
        throw new Error(`Failed to extract ${path.basename(debFile)} into ${userLibraryRoot}`);
      }
    }

    const finalDirs = getLocalPlaywrightLibraryDirs(cwd);
    if (!hasRequiredChromiumLibrary(finalDirs)) {
      throw new Error(
        "Playwright libraries were downloaded, but libnspr4.so is still missing. Install Chromium dependencies manually or re-run on Ubuntu/Debian.",
      );
    }

    return userLibraryRoot;
  } finally {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
}
