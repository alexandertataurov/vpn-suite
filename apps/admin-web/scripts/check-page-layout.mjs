#!/usr/bin/env node
/**
 * Ensures every dashboard page under src/features uses PageLayout.
 * Allowlist: LoginPage (full-screen, non-dashboard).
 * Run from apps/admin-web: node scripts/check-page-layout.mjs
*/

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const featuresDir = join(__dirname, "..", "src", "features");
const allowlist = new Set(["LoginPage"]);

function findPageFiles(dir, base = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      files.push(...findPageFiles(join(dir, e.name), rel));
    } else if (e.isFile() && e.name.endsWith("Page.tsx")) {
      files.push({ path: join(dir, e.name), rel, name: e.name.replace(".tsx", "") });
    }
  }
  return files;
}

const pageFiles = findPageFiles(featuresDir);
const missing = [];

for (const { path: filePath, name } of pageFiles) {
  if (allowlist.has(name)) continue;
  const content = readFileSync(filePath, "utf8");
  if (!content.includes("PageLayout")) {
    missing.push(name);
  }
}

if (missing.length > 0) {
  console.error("Layout check failed: these dashboard pages must use PageLayout as the root wrapper:");
  missing.forEach((m) => console.error("  -", m));
  process.exit(1);
}

console.log("Layout check passed: all dashboard pages use PageLayout.");
