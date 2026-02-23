#!/usr/bin/env node
/**
 * Foundations lint — detect primitive/hex token misuse in components.
 * Run: npm run foundations:lint -w shared
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC_UI = join(process.cwd(), "src", "ui");
const PRIMITIVE_PATTERN = /var\(--(?:color-(?:gray|primary|success|warning|error|ink)-\d+)|spacing-\d+|radius-(?:none|sm|md|lg|xl|2xl|full)\)/g;
const HEX_PATTERN = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_PATTERN = /rgb\s*\([^)]+\)|rgba\s*\([^)]+\)/g;

/** Set FOUNDATIONS_STRICT=1 to fail on violations (default: warn only). */
const strict = process.env.FOUNDATIONS_STRICT === "1";
let hasErrors = false;

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("__")) scan(full);
    else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".stories.tsx")) {
      const content = readFileSync(full, "utf-8");
      const rel = full.replace(process.cwd(), "").replace(/^\//, "");
      const primMatches = content.match(PRIMITIVE_PATTERN);
      const hexMatches = content.match(HEX_PATTERN);
      const rgbMatches = content.match(RGB_PATTERN);
      if (primMatches?.length) {
        console.error(`[foundations] ${rel}: primitive tokens (use semantic):`, [...new Set(primMatches)]);
        hasErrors = true;
      }
      if (hexMatches?.length || rgbMatches?.length) {
        console.error(`[foundations] ${rel}: raw hex/rgb (use var(--color-*))`);
        hasErrors = true;
      }
    }
  }
}

scan(SRC_UI);
process.exit(strict && hasErrors ? 1 : 0);
