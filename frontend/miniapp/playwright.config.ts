import { defineConfig, devices } from "@playwright/test";

const serverURL = process.env.PLAYWRIGHT_SERVER_URL || "http://127.0.0.1:5175/";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || new URL("webapp/", serverURL).toString();
// Default to Vite dev server because preview mode is flaky across multi-file runs in this workspace.
const webServerMode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || "dev";

function getWebServerCommand() {
    if (webServerMode === "dev") {
        return "npx vite --host 127.0.0.1 --port 5175 --strictPort";
    }
    return "test -d dist || npm run build; npx vite preview --host 127.0.0.1 --port 5175 --strictPort";
}

const shouldStartWebServer =
    !process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_NO_WEBSERVER !== "1";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: !process.env.CI,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [["html", { open: "never" }]],
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.0001,
            animations: "disabled",
            caret: "hide",
            scale: "css",
        },
    },
    use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
    snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: shouldStartWebServer
        ? {
            command: getWebServerCommand(),
            url: serverURL,
            reuseExistingServer: true,
            timeout: 180000,
        }
        : undefined,
});
