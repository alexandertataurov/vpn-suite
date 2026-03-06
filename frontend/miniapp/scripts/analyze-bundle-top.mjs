#!/usr/bin/env node
/* global console, process */

import fs from "node:fs";
import path from "node:path";

const analysisPath = path.resolve(process.cwd(), "dist", "bundle-analysis.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(analysisPath)) {
  fail(
    `Bundle analysis file not found at ${analysisPath}.\n` +
      "Run `pnpm run build:analyze` first.",
  );
}

const raw = fs.readFileSync(analysisPath, "utf8");
const data = JSON.parse(raw);

if (!data?.tree || !data?.nodeMetas || !data?.nodeParts) {
  fail("Unexpected analysis format. Ensure rollup visualizer uses template 'raw-data'.");
}

function collectJsChunks(node, out = new Set()) {
  if (!node?.children) return out;
  for (const child of node.children) {
    if (typeof child.name === "string" && child.name.startsWith("assets/") && child.name.endsWith(".js")) {
      out.add(child.name);
    }
    collectJsChunks(child, out);
  }
  return out;
}

const chunks = [...collectJsChunks(data.tree)];

function chunkRenderedSize(chunkName) {
  let sum = 0;
  for (const meta of Object.values(data.nodeMetas)) {
    const partUid = meta?.moduleParts?.[chunkName];
    if (!partUid) continue;
    sum += data.nodeParts?.[partUid]?.renderedLength ?? 0;
  }
  return sum;
}

const chunkRows = chunks
  .map((chunk) => ({ chunk, rendered: chunkRenderedSize(chunk) }))
  .sort((a, b) => b.rendered - a.rendered);

const main = chunkRows[0];
if (!main) {
  fail("No JS chunks found in analysis payload.");
}

const moduleRows = [];
for (const meta of Object.values(data.nodeMetas)) {
  const partUid = meta?.moduleParts?.[main.chunk];
  if (!partUid) continue;
  const part = data.nodeParts?.[partUid] ?? {};
  moduleRows.push({
    id: meta?.id ?? "(unknown)",
    rendered: part.renderedLength ?? 0,
    gzip: part.gzipLength ?? 0,
  });
}
moduleRows.sort((a, b) => b.rendered - a.rendered);

console.log("Top JS chunks (rendered bytes):");
for (const row of chunkRows.slice(0, 6)) {
  console.log(`${String(row.rendered).padStart(9)}  ${row.chunk}`);
}

console.log(`\nMain chunk: ${main.chunk} (${main.rendered} bytes rendered)`);
console.log("Top modules in main chunk:");
for (const row of moduleRows.slice(0, 20)) {
  console.log(`${String(row.rendered).padStart(8)}  ${String(row.gzip).padStart(6)}  ${row.id}`);
}

const hasTailwindMerge = moduleRows.some((row) => String(row.id).includes("tailwind-merge"));
const hasSentry = moduleRows.some((row) => String(row.id).includes("@sentry"));
console.log(`\nContains tailwind-merge in main chunk: ${hasTailwindMerge ? "yes" : "no"}`);
console.log(`Contains sentry in main chunk: ${hasSentry ? "yes" : "no"}`);
