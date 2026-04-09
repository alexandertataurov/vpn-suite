import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4174/admin/";
// Default to dev server for local runs so /admin/* history routes work reliably.
// CI uses an externally started dev server via PLAYWRIGHT_BASE_URL and does not start a webServer here.
const webServerMode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || "dev";

function getWebServerCommand() {
  if (webServerMode === "dev") {
    return "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort";
  }
  return "test -d dist || npm run build; npm run preview -- --host 127.0.0.1 --port 4174 --strictPort";
}

// Start a local webServer unless explicitly disabled or an external base URL is provided.
// Do not rely on `CI` here: some environments set CI=1 even for local runs.
const shouldStartWebServer =
  !process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_NO_WEBSERVER !== "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // Never start an interactive report server on failures; our audit runner must terminate deterministically.
  reporter: [["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: shouldStartWebServer
    ? {
        command: getWebServerCommand(),
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180000,
      }
    : undefined,
});
