#!/usr/bin/env node
/**
 * Validates that each exported UI component has a story with Meta.title and description.
 * Run: node scripts/storybook-check.mjs
 * Exit 0 = pass, 1 = fail
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharedRoot = join(__dirname, "..");
const uiIndexPath = join(sharedRoot, "src", "ui", "index.ts");
const uiSrcPath = join(sharedRoot, "src", "ui");
const adminPath = join(sharedRoot, "..", "admin", "src");
const miniappPath = join(sharedRoot, "..", "miniapp", "src");

// Components that must have stories (from ui/index.ts exports, excluding types/utils)
// Components that must have stories; story file name matches (e.g. Button.stories.tsx)
const REQUIRED_SHARED = [
  "Button", "ButtonLink", "Field", "Input", "Checkbox", "RadioGroup", "Select", "SearchInput",
  "Skeleton", "EmptyState", "ErrorState", "InlineError", "PageError",
  "DeviceCard", "ProfileCard", "Modal", "Drawer",
  "Table", "VirtualTable", "VisuallyHidden",
  "FormStack", "Inline", "Divider", "Spinner", "ProgressBar",
  "InlineAlert", "CopyButton", "CodeBlock", "QrPanel", "RelativeTime",
  "Text", "Heading", "Label", "HelperText", "Stat", "CodeText",
  "Tabs", "DropdownMenu", "BulkActionsBar", "LiveIndicator"
];

// Toast is exported as ToastContainer; story is Toast.stories
const ALIAS = { ToastContainer: "Toast" };

function findStories(dir) {
  const files = [];
  try {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) {
        files.push(...findStories(join(dir, f.name)));
      } else if (f.name.endsWith(".stories.tsx") || f.name.endsWith(".stories.ts")) {
        files.push(join(dir, f.name));
      }
    }
  } catch (_) {}
  return files;
}

function parseStoryFile(path) {
  const content = readFileSync(path, "utf-8");
  const hasTitle = /title:\s*["']/.test(content) || /Meta\s+title=/.test(content);
  const hasDescription = /parameters\.docs\.description|docs:\s*\{\s*description/.test(content) ||
    /description\.component/.test(content);
  const component = path.match(/([^/\\]+)\.stories\./)?.[1];
  return { component, hasTitle, hasDescription };
}

const allStories = [
  ...findStories(uiSrcPath),
  ...findStories(join(adminPath, "components")),
  ...findStories(miniappPath),
];

const storyMap = new Map();
for (const p of allStories) {
  const { component, hasTitle, hasDescription } = parseStoryFile(p);
  if (component) {
    storyMap.set(component, { hasTitle, hasDescription, path: p });
  }
}

let failed = false;
const missing = [];
const incomplete = [];

for (const comp of REQUIRED_SHARED) {
  const storyComp = ALIAS[comp] || comp;
  const info = storyMap.get(storyComp);
  if (!info) {
    if (comp === "VirtualTable") {
      const tableInfo = storyMap.get("Table");
      if (tableInfo) {
        const tableContent = readFileSync(tableInfo.path, "utf-8");
        if (tableContent.includes("VirtualTable")) continue;
      }
    }
    missing.push(comp);
    failed = true;
  } else if (!info.hasTitle || !info.hasDescription) {
    incomplete.push(`${storyComp} (title=${info.hasTitle}, description=${info.hasDescription})`);
    failed = true;
  }
}

if (missing.length) {
  console.error("Missing stories:", missing.join(", "));
}
if (incomplete.length) {
  console.error("Stories missing title or description:", incomplete.join(", "));
}
if (failed) process.exit(1);
console.log("Storybook check passed: all required components have stories with title and description.");
