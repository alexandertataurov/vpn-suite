import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const root = "/opt/vpn-suite/frontend";
const sharedUiRoot = path.join(root, "shared/src/ui");
const adminComponentsRoot = path.join(root, "admin/src/components");
const miniappRoot = path.join(root, "miniapp/src");
const docsRoot = path.join(root, "shared/src/docs");

const storyFiles = [];
const docFiles = [];

function walk(dir, fileList, ext) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, fileList, ext);
    else if (entry.isFile() && full.endsWith(ext)) fileList.push(full);
  }
}

walk(sharedUiRoot, storyFiles, ".stories.tsx");
walk(adminComponentsRoot, storyFiles, ".stories.tsx");
walk(miniappRoot, storyFiles, ".stories.tsx");
walk(docsRoot, docFiles, ".mdx");

const storyBasenames = new Set(storyFiles.map((f) => path.basename(f, ".stories.tsx").toLowerCase()));
const docBasenames = new Set(docFiles.map((f) => path.basename(f, ".mdx").toLowerCase()));

const ignoreDirs = new Set(["__tests__"]);

function listTsxFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      out.push(...listTsxFiles(full));
    } else if (entry.isFile() && full.endsWith(".tsx") && !full.endsWith(".stories.tsx")) {
      out.push(full);
    }
  }
  return out;
}

function extractExports(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const names = new Set();
  const exportFunc = /export\s+(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/g;
  let match;
  while ((match = exportFunc.exec(text)) !== null) names.add(match[1]);
  const exportList = /export\s*\{([^}]+)\}/g;
  while ((match = exportList.exec(text)) !== null) {
    const parts = match[1].split(",").map((p) => p.trim().split(/\s+as\s+/)[0]);
    for (const p of parts) if (/^[A-Z]/.test(p)) names.add(p);
  }
  return [...names];
}

function typeFromPath(filePath) {
  if (filePath.includes("/shared/src/ui/primitives/")) return "Primitive";
  if (filePath.includes("/shared/src/ui/forms/")) return "Primitive";
  if (filePath.includes("/shared/src/ui/layout/")) return "Primitive";
  if (filePath.includes("/shared/src/ui/typography/")) return "Primitive";
  if (filePath.includes("/shared/src/ui/feedback/")) return "Primitive";
  if (filePath.includes("/shared/src/ui/patterns/")) return "Pattern";
  if (filePath.includes("/shared/src/ui/")) return "Component";

  if (filePath.includes("/admin/src/components/operator/")) return "Pattern";
  if (filePath.includes("/admin/src/components/servers/")) return "Component";
  if (filePath.includes("/admin/src/components/")) return "Component";

  if (filePath.includes("/miniapp/src/layouts/") || filePath.includes("/miniapp/src/pages/")) return "Page";

  return "Component";
}

function isUsedInProd(name) {
  const targets = [
    path.join(root, "admin/src/pages"),
    path.join(root, "miniapp/src/pages"),
  ];
  const result = spawnSync("rg", ["-l", `\\b${name}\\b`, ...targets], { encoding: "utf8" });
  return result.status === 0;
}

const files = [
  ...listTsxFiles(sharedUiRoot),
  ...listTsxFiles(adminComponentsRoot),
  ...listTsxFiles(path.join(miniappRoot, "layouts")),
  ...listTsxFiles(path.join(miniappRoot, "pages")),
];

const rows = [];
for (const file of files) {
  const exports = extractExports(file);
  if (exports.length === 0) continue;
  for (const name of exports) {
    const hasStory = storyBasenames.has(name.toLowerCase());
    const hasDocs = docBasenames.has(name.toLowerCase());
    rows.push({
      name,
      path: file.replace(root + "/", ""),
      type: typeFromPath(file),
      used: isUsedInProd(name) ? "Yes" : "No",
      hasStory: hasStory ? "Yes" : "No",
      hasDocs: hasDocs ? "Yes" : "No",
      notes: "",
    });
  }
}

rows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

const header = ["Name", "Path", "Type", "Used in Prod", "Has Story", "Has Docs", "Notes"];
const lines = [
  "# Component Inventory",
  "",
  "| " + header.join(" | ") + " |",
  "| " + header.map(() => "---").join(" | ") + " |",
  ...rows.map((r) => `| ${r.name} | ${r.path} | ${r.type} | ${r.used} | ${r.hasStory} | ${r.hasDocs} | ${r.notes} |`),
  "",
];

fs.writeFileSync(path.join(root, "shared/docs/ComponentInventory.md"), lines.join("\n"));
