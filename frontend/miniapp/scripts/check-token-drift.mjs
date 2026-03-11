#!/usr/bin/env node
/**
 * Token drift check — verifies tokens-map PRIMITIVES align with tokens/*.ts.
 * Run: node scripts/check-token-drift.mjs
 * Exit 0 = no drift; 1 = drift found.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const EXPECTED = {
  zIndex: ["dropdown", "overlay", "modal", "toast", "header", "nav", "scanline"],
  motion: ["fast", "normal", "slow"],
  radius: ["none", "sm", "md", "lg", "xl", "2xl", "full", "control", "surface", "button"],
  shadow: ["none", "sm", "md", "lg", "card", "focusRing"],
};

let hasDrift = false;

const zIndexTs = readFileSync(join(ROOT, "src/design-system/tokens/zIndex.ts"), "utf-8");
for (const z of EXPECTED.zIndex) {
  if (!zIndexTs.includes(z)) {
    console.error(`[token-drift] zIndex.${z} not in tokens/zIndex.ts`);
    hasDrift = true;
  }
}

const motionTs = readFileSync(join(ROOT, "src/design-system/tokens/motion.ts"), "utf-8");
for (const d of EXPECTED.motion) {
  if (!motionTs.includes(d)) {
    console.error(`[token-drift] duration.${d} not in tokens/motion.ts`);
    hasDrift = true;
  }
}

const radiusTs = readFileSync(join(ROOT, "src/design-system/tokens/radius.ts"), "utf-8");
for (const r of EXPECTED.radius) {
  if (!radiusTs.includes(r)) {
    console.error(`[token-drift] radius.${r} not in tokens/radius.ts`);
    hasDrift = true;
  }
}

const shadowsTs = readFileSync(join(ROOT, "src/design-system/tokens/shadows.ts"), "utf-8");
for (const s of EXPECTED.shadow) {
  if (!shadowsTs.includes(s)) {
    console.error(`[token-drift] shadow.${s} not in tokens/shadows.ts`);
    hasDrift = true;
  }
}

if (hasDrift) {
  console.error("\ntoken-drift: PRIMITIVES out of sync with tokens/*.ts");
  process.exit(1);
}
console.log("token-drift: OK");
