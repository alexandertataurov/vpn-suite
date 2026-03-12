/* global console, process */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "glob";

const root = process.cwd();
const storyFiles = globSync("src/**/*.stories.@(ts|tsx|js|jsx|mjs)", { cwd: root, nodir: true });

const allowedRoots = new Set(["Foundations", "Primitives", "Components", "Patterns", "Layouts", "Pages", "States"]);
const pageModes = new Set(["Contracts", "Sandbox"]);
const violations = [];

for (const relativePath of storyFiles) {
  const absolutePath = join(root, relativePath);
  const source = readFileSync(absolutePath, "utf8");
  const match = source.match(/title:\s*"([^"]+)"/);
  if (!match) {
    violations.push(`${relativePath}: missing Storybook title`);
    continue;
  }

  const title = match[1];
  const segments = title.split("/");
  const [rootSegment, secondSegment] = segments;

  if (!rootSegment || !allowedRoots.has(rootSegment)) {
    violations.push(
      `${relativePath}: title "${title}" must start with one of ${Array.from(allowedRoots).join(", ")}`,
    );
    continue;
  }

  if (rootSegment === "Pages" && (!secondSegment || !pageModes.has(secondSegment))) {
    violations.push(
      `${relativePath}: page story title "${title}" must use Pages/Contracts/* or Pages/Sandbox/*`,
    );
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`storybook:taxonomy — ${violation}`);
  }
  process.exit(1);
}

console.log(`storybook:taxonomy — passed (${storyFiles.length} stories)`);
