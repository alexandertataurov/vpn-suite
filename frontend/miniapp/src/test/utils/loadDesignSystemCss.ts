import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
const cssFiles = [
  "src/design-system/styles/tokens/base.css",
  "src/design-system/styles/theme/telegram.css",
  "src/design-system/styles/theme/consumer.css",
];

let loaded = false;

export function loadDesignSystemCss() {
  if (loaded) return;
  const style = document.createElement("style");
  style.setAttribute("data-test-design-system", "true");
  style.textContent = cssFiles
    .map((relativePath) => readFileSync(path.join(projectRoot, relativePath), "utf8"))
    .join("\n");
  document.head.appendChild(style);
  loaded = true;
}
