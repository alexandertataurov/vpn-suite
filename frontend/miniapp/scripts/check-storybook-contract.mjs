/* global console, process */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STORYBOOK_CONTRACT_STORIES, STORYBOOK_CONTRACT_TAG } from "./storybook-contract-config.mjs";

const root = process.cwd();
const violations = [];

for (const relativePath of STORYBOOK_CONTRACT_STORIES) {
  const absolutePath = join(root, relativePath);

  if (!existsSync(absolutePath)) {
    violations.push(`${relativePath}: missing required contract story file`);
    continue;
  }

  const source = readFileSync(absolutePath, "utf8");

  if (!source.includes(`"${STORYBOOK_CONTRACT_TAG}"`) && !source.includes(`'${STORYBOOK_CONTRACT_TAG}'`)) {
    violations.push(`${relativePath}: missing "${STORYBOOK_CONTRACT_TAG}" tag`);
  }

  if (!/title:\s*"[^"]+"/.test(source) && !/title:\s*'[^']+'/.test(source)) {
    violations.push(`${relativePath}: missing explicit Storybook title`);
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`storybook:contract — ${violation}`);
  }
  process.exit(1);
}

console.log(`storybook:contract — passed (${STORYBOOK_CONTRACT_STORIES.length} stories)`);
