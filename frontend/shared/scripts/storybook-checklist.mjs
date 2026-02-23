import fs from "fs";
import path from "path";

const root = "/opt/vpn-suite/frontend";
const storyRoots = [
  path.join(root, "shared/src/ui"),
  path.join(root, "admin/src/components"),
  path.join(root, "admin/src/pages"),
  path.join(root, "miniapp/src"),
];

const required = [
  "Overview",
  "Variants",
  "Sizes",
  "States",
  "WithLongText",
  "EdgeCases",
  "DarkMode",
  "Accessibility",
];

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith(".stories.tsx")) out.push(full);
  }
}

const storyFiles = [];
for (const rootDir of storyRoots) walk(rootDir, storyFiles);

const rows = storyFiles.map((file) => {
  const text = fs.readFileSync(file, "utf8");
  const titleMatch = text.match(/title:\s*\"([^\"]+)\"/);
  const title = titleMatch ? titleMatch[1] : path.basename(file, ".stories.tsx");
  const exports = new Set();
  const exportRegex = /export\s+const\s+([A-Za-z0-9_]+)/g;
  let match;
  while ((match = exportRegex.exec(text)) !== null) exports.add(match[1]);
  const checks = required.map((name) => (exports.has(name) ? "✅" : "—"));
  return { title, checks };
});

rows.sort((a, b) => a.title.localeCompare(b.title));

const header = ["Story", ...required];
const lines = [
  "# Storybook Checklist",
  "",
  "| " + header.join(" | ") + " |",
  "| " + header.map(() => "---").join(" | ") + " |",
  ...rows.map((r) => `| ${r.title} | ${r.checks.join(" | ")} |`),
  "",
];

fs.writeFileSync(path.join(root, "shared/docs/StorybookChecklist.md"), lines.join("\n"));
