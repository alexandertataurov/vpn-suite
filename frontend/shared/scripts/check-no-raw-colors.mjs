#!/usr/bin/env node
/**
 * Guardrail: fail if raw hex/rgb/hsl is introduced in runtime UI code.
 *
 * Scope: frontend/{admin,miniapp,shared}/src
 * Exclusions:
 * - shared token sources + generated tokens.css
 * - chart theme/presets (canvas/tooltips may need rgba fallbacks)
 * - docs + storybook config
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharedRoot = join(__dirname, "..");
const frontendRoot = join(sharedRoot, "..");

const TARGET_DIRS = [
  join(frontendRoot, "admin", "src"),
  join(frontendRoot, "miniapp", "src"),
  join(frontendRoot, "shared", "src"),
];

const RAW_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgb\s*\(|rgba\s*\(|hsl\s*\(|hsla\s*\(/;

function isExcluded(filePath) {
  const rel = filePath.replace(frontendRoot, "").replace(/^[\\/]/, "");

  // Generated tokens + token build
  if (rel === "shared/src/theme/tokens.css") return true;
  if (rel === "shared/scripts/build-tokens.js") return true;
  if (rel.startsWith("shared/tokens/")) return true;

  // Charts exceptions (canvas + tooltip styling)
  if (rel.startsWith("admin/src/charts/")) return true;

  // Docs + storybook
  if (rel.startsWith("shared/src/docs/")) return true;
  if (rel.startsWith("shared/docs/")) return true;
  if (rel.startsWith("shared/.storybook/")) return true;

  return false;
}

function scanDir(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      scanDir(full, out);
      continue;
    }

    if (!/\.(ts|tsx|css|mdx)$/.test(entry.name)) continue;
    if (isExcluded(full)) continue;

    const content = readFileSync(full, "utf8");
    if (!RAW_COLOR_RE.test(content)) continue;

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (RAW_COLOR_RE.test(line)) {
        const rel = full.replace(frontendRoot, "").replace(/^[\\/]/, "");
        out.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

const hits = [];
for (const dir of TARGET_DIRS) scanDir(dir, hits);

if (hits.length) {
  console.error("[guardrails] Raw hex/rgb/hsl detected (use tokens):");
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}

console.log("[guardrails] OK: no raw hex/rgb/hsl in runtime UI code.");

