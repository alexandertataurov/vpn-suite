import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
const baseCssFiles = [
  "src/design-system/styles/tokens/base.css",
  "src/design-system/styles/tokens/_breakpoints.css",
  "src/design-system/styles/theme/consumer.css",
] as const;

let loadedKey: string | null = null;

export function loadDesignSystemCss({ includeTelegram = true }: { includeTelegram?: boolean } = {}) {
  const cssFiles = includeTelegram
    ? [baseCssFiles[0], baseCssFiles[1], "src/design-system/styles/theme/telegram.css", baseCssFiles[2]]
    : baseCssFiles;
  const key = cssFiles.join("|");
  if (loadedKey === key) return;
  document
    .querySelectorAll('style[data-test-design-system="true"]')
    .forEach((node) => node.parentNode?.removeChild(node));
  const style = document.createElement("style");
  style.setAttribute("data-test-design-system", "true");
  style.textContent = cssFiles
    .map((relativePath) => readFileSync(path.join(projectRoot, relativePath), "utf8"))
    .join("\n");
  document.head.appendChild(style);
  loadedKey = key;
}
