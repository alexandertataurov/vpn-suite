/* global console, process */
/**
 * Page contract stories must live only under src/stories/pages/.
 * A duplicate tree under src/stories/design-system/stories/pages/ produces duplicate story IDs.
 */
import { globSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const forbiddenPatterns = [
  "src/stories/design-system/stories/pages/**/*.stories.@(ts|tsx|js|jsx)",
  "src/design-system/stories/pages/**/*.stories.@(ts|tsx|js|jsx)",
];
const forbidden = forbiddenPatterns.flatMap((p) => globSync(p, { cwd: root }));

if (forbidden.length > 0) {
  console.error(
    "storybook:page-stories — duplicate page stories found (same IDs as src/stories/pages/). Remove:",
  );
  for (const f of forbidden) {
    console.error(`  ${join(root, f)}`);
  }
  console.error(
    "\nCanonical: src/stories/pages/*.stories.tsx — delete duplicate trees under design-system/.../stories/pages/",
  );
  process.exit(1);
}

console.log("storybook:page-stories — passed (no duplicate page story tree)");
