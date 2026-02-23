import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5175/webapp/";
const webServerMode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || "dev";

function getWebServerCommand() {
    if (webServerMode === "dev") {
        return "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort";
    }
    return "test -d dist || npm run build; npm run preview -- --host 127.0.0.1 --port 5175 --strictPort";
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
