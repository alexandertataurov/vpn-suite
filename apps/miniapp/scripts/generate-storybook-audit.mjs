import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src", "stories");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() && /\.stories\.[tj]sx?$/.test(entry.name) ? [path] : [];
  });
}

function classify(file) {
  const normalized = file.split("/").join("/");
  if (normalized.includes("/foundations/")) return "foundations";
  if (normalized.includes("/core/primitives/")) return "primitives";
  if (normalized.includes("/components/")) return "components";
  if (normalized.includes("/compositions/patterns/")) return "patterns";
  if (normalized.includes("/compositions/recipes/")) return "recipes";
  if (normalized.includes("/pages/")) return "pages";
  return "other";
}

function has(pattern, text) {
  return pattern.test(text);
}

function extractPageStoryBlocks(text) {
  const matches = [...text.matchAll(/^export const\s+([A-Za-z0-9_]+)/gm)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    const block = text.slice(start, end);
    const nameMatch = block.match(/name:\s*["']([^"']+)["']/m);
    const storyMatch = block.match(/story:\s*["']([\s\S]*?)["']\s*,/m);
    return {
      exportName: match[1],
      name: nameMatch?.[1] ?? match[1],
      storyText: storyMatch?.[1] ?? "",
      block,
    };
  });
}

function bucketStory(story) {
  const scope = `${story.exportName}\n${story.name}\n${story.storyText}\n${story.block}`.toLowerCase();
  const buckets = new Set();
  if (/interactive|play\s*:/.test(story.block.toLowerCase())) buckets.add("interactive");
  if (/viewport|iphonese|mobile390|desktop/.test(scope)) buckets.add("viewport");
  if (/loading|skeleton|slow network|pending/.test(scope)) buckets.add("loading");
  if (/error|fail|could not load|offline|unavailable/.test(scope)) buckets.add("error");
  if (/empty|missing|no active|no plan|no devices|session missing|not restorable/.test(scope)) buckets.add("empty");
  if (/ready|active|confirmed|happy path|default/.test(scope)) buckets.add("ready");
  return [...buckets];
}

function richnessLabel(bucketCounts) {
  const meaningfulBuckets = Object.entries(bucketCounts).filter(([bucket, count]) => bucket !== "viewport" && count > 0);
  const distinct = meaningfulBuckets.length;
  if (distinct >= 4) return "matrix-like";
  if (distinct >= 3) return "multi-state";
  if (distinct >= 2) return "paired";
  return "single-path";
}

const files = walk(ROOT);
const rows = files.map((file) => {
  const text = readFileSync(file, "utf8");
  const rel = relative(process.cwd(), file).split("\\").join("/");
  const kind = classify(rel);
  return {
    file: rel,
    kind,
    hasArgs: has(/\bargs\s*:/m, text),
    hasPlay: has(/\bplay\s*:/m, text),
    hasViewport: has(/\bviewport\s*:/m, text),
    hasAutodocs: has(/tags\s*:\s*\[[^\]]*["']autodocs["']/m, text),
    hasContractTag: has(/tags\s*:\s*\[[^\]]*["']contract-test["']/m, text),
  };
});

const counts = rows.reduce(
  (acc, row) => {
    acc.total += 1;
    acc[row.kind] = (acc[row.kind] ?? 0) + 1;
    return acc;
  },
  { total: 0, foundations: 0, primitives: 0, components: 0, patterns: 0, recipes: 0, pages: 0, other: 0 },
);

const pageRows = rows.filter((row) => row.kind === "pages");
const pageRichnessRows = pageRows.map((row) => {
  const text = readFileSync(row.file, "utf8");
  const stories = extractPageStoryBlocks(text);
  const bucketCounts = stories.reduce(
    (acc, story) => {
      for (const bucket of bucketStory(story)) {
        acc[bucket] = (acc[bucket] ?? 0) + 1;
      }
      return acc;
    },
    { ready: 0, loading: 0, error: 0, empty: 0, interactive: 0, viewport: 0 },
  );
  const richness = richnessLabel(bucketCounts);
  const signals = Object.entries(bucketCounts)
    .filter(([, count]) => count > 0)
    .map(([bucket, count]) => `${bucket}:${count}`)
    .join(", ");
  return {
    file: row.file,
    stories: stories.length,
    richness,
    signals,
  };
});

function yn(value) {
  return value ? "yes" : "no";
}

console.log("# Miniapp Storybook Audit");
console.log("");
console.log("## Inventory Snapshot");
console.log("");
console.log(`- Total story files: **${counts.total}**`);
console.log(`- Foundations: **${counts.foundations}**`);
console.log(`- Primitives: **${counts.primitives}**`);
console.log(`- Components: **${counts.components}**`);
console.log(`- Patterns: **${counts.patterns}**`);
console.log(`- Recipes: **${counts.recipes}**`);
console.log(`- Pages: **${counts.pages}**`);
console.log("");
console.log("## Page Contract Coverage");
console.log("");
console.log("| File | autodocs | viewport | play | contract-test |");
console.log("|------|----------|----------|------|---------------|");
for (const row of pageRows) {
  console.log(
    `| \`${row.file.replace(/^src\/stories\//, "")}\` | ${yn(row.hasAutodocs)} | ${yn(row.hasViewport)} | ${yn(row.hasPlay)} | ${yn(row.hasContractTag)} |`,
  );
}

console.log("");
console.log("## State Richness");
console.log("");
console.log("| File | stories | richness | signals |");
console.log("|------|---------|----------|---------|");
for (const row of pageRichnessRows) {
  console.log(
    `| \`${row.file.replace(/^src\/stories\//, "")}\` | ${row.stories} | ${row.richness} | ${row.signals || "none"} |`,
  );
}
