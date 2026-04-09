import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST_ASSETS_DIR = join(process.cwd(), "dist", "assets");
const RAW_BUDGET_BYTES = Number(process.env.CSS_BUDGET_BYTES ?? 110 * 1024);

function formatBytes(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(2)}KB`;
}

const cssAssets = readdirSync(DIST_ASSETS_DIR)
  .filter((name) => /^index-.*\.css$/i.test(name))
  .sort();

if (cssAssets.length === 0) {
  console.error(`[css-budget] No built CSS asset found in ${DIST_ASSETS_DIR}`);
  process.exit(1);
}

const cssFileName = cssAssets[cssAssets.length - 1];
const cssPath = join(DIST_ASSETS_DIR, cssFileName);
const cssBuffer = readFileSync(cssPath);
const rawBytes = cssBuffer.byteLength;
const gzipBytes = gzipSync(cssBuffer).byteLength;

if (rawBytes > RAW_BUDGET_BYTES) {
  console.error(
    `[css-budget] FAIL ${cssFileName}: raw ${formatBytes(rawBytes)} exceeds budget ${formatBytes(RAW_BUDGET_BYTES)} (gzip ${formatBytes(gzipBytes)}).`
  );
  process.exit(1);
}

console.log(
  `[css-budget] PASS ${cssFileName}: raw ${formatBytes(rawBytes)} within budget ${formatBytes(RAW_BUDGET_BYTES)} (gzip ${formatBytes(gzipBytes)}).`
);
