import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src");

const REQUIRED_TAGS = ["smoke", "a11y", "interaction"];
const HIGH_RISK_TITLES = [
  "UI/Components/Buttons/Button",
  "UI/Components/Buttons/ButtonLink",
  "UI/Components/Inputs/Input",
  "UI/Components/Inputs/Select",
  "UI/Components/Inputs/Checkbox",
  "UI/Components/Inputs/SearchInput",
  "UI/Components/Inputs/RadioGroup",
  "UI/Components/Inputs/Textarea",
  "UI/Components/Overlays/Modal",
  "UI/Components/Overlays/Drawer",
  "UI/Components/Data Table/Table",
  "UI/Components/Feedback/Toast",
  "UI/Components/Overlays/DropdownMenu",
  "UI/Components/Data Table/Pagination",
  "UI/Navigation/Overview",
  "UI/Components/CommandPalette",
  "UI/Components/CommandPalette/ServersCommandPalette",
];

async function listStoryFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listStoryFiles(full);
    if (entry.isFile() && entry.name.endsWith(".stories.tsx")) return [full];
    return [];
  }));
  return files.flat();
}

function extractMetaTitle(content) {
  const match = content.match(/title:\s*\"([^\"]+)\"/);
  return match ? match[1] : null;
}

function extractTags(content) {
  const matches = [...content.matchAll(/tags:\s*\[([^\]]*)\]/g)];
  if (!matches.length) return [];
  const tags = new Set();
  for (const match of matches) {
    const parts = match[1]
      .split(",")
      .map((v) => v.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
    for (const tag of parts) tags.add(tag);
  }
  return Array.from(tags);
}

async function main() {
  const files = await listStoryFiles(ROOT);
  const failures = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const title = extractMetaTitle(content);
    if (!title || !HIGH_RISK_TITLES.includes(title)) continue;

    const tags = extractTags(content);
    const missing = REQUIRED_TAGS.filter((t) => !tags.includes(t));
    if (missing.length) {
      failures.push({ file, title, missing });
    }
  }

  if (failures.length) {
    console.error("Storybook guardrails failed. Missing tags for high-risk stories:");
    for (const f of failures) {
      console.error(`- ${f.title} (${f.file}): missing ${f.missing.join(", ")}`);
    }
    process.exit(1);
  }

  console.log("Storybook guardrails passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
