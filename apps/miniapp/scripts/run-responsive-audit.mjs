import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildPlaywrightEnv, ensurePlaywrightLibraries } from "./playwright-env.mjs";

const cwd = process.cwd();
const resultsDir = path.join(cwd, "test-results", "responsive-audit");
const reportJsonPath = path.join(resultsDir, "report.json");
const ledgerJsonPath = path.join(resultsDir, "ledger.json");
const ledgerMarkdownPath = path.join(resultsDir, "ledger.md");
const extraArgs = process.argv.slice(2);

ensurePlaywrightLibraries({ cwd });
fs.mkdirSync(resultsDir, { recursive: true });

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "e2e/responsive-audit.spec.ts",
    "--reporter=json",
    `--output=${resultsDir}`,
    ...extraArgs,
  ],
  {
    cwd,
    env: buildPlaywrightEnv({ cwd }),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    shell: process.platform === "win32",
  },
);

if (result.error) {
  throw result.error;
}

const rawOutput = `${result.stdout ?? ""}`.trim();

function collectSpecResults(suites, titlePath = []) {
  const rows = [];

  for (const suite of suites ?? []) {
    const nextTitlePath = suite.title ? [...titlePath, suite.title] : titlePath;

    for (const spec of suite.specs ?? []) {
      const specTitlePath = [...nextTitlePath, spec.title];
      for (const testCase of spec.tests ?? []) {
        const latestResult = [...(testCase.results ?? [])].at(-1) ?? null;
        rows.push({
          titlePath: specTitlePath,
          status: latestResult?.status ?? "unknown",
          durationMs: latestResult?.duration ?? 0,
          errorMessage:
            latestResult?.error?.message ??
            latestResult?.errors?.[0]?.message ??
            (typeof latestResult?.error === "string" ? latestResult.error : "") ??
            "",
          screenshot:
            latestResult?.attachments?.find((attachment) => attachment.name === "screenshot" && attachment.path)
              ?.path ??
            latestResult?.attachments?.find((attachment) => attachment.path && attachment.path.endsWith(".png"))?.path ??
            "",
        });
      }
    }

    rows.push(...collectSpecResults(suite.suites ?? [], nextTitlePath));
  }

  return rows;
}

function escapeCell(value) {
  return String(value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function formatRelativeFile(filePath) {
  if (!filePath) return "";
  return path.relative(cwd, filePath).split(path.sep).join("/");
}

function renderMarkdown(entries) {
  const summary = entries.reduce(
    (acc, entry) => {
      acc.total += 1;
      acc[entry.status] = (acc[entry.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0, unknown: 0 },
  );

  const lines = [
    "# Responsive Audit Ledger",
    "",
    "## Summary",
    "",
    `- Total cases: **${summary.total}**`,
    `- Passed: **${summary.passed ?? 0}**`,
    `- Failed: **${summary.failed ?? 0}**`,
    `- Skipped: **${summary.skipped ?? 0}**`,
    `- Timed out: **${summary.timedOut ?? 0}**`,
    "",
    "## Results",
    "",
    "| Mode | Viewport | Route | Status | Failure | Screenshot |",
    "|------|----------|-------|--------|---------|------------|",
  ];

  for (const entry of entries) {
    const [mode = "", viewport = "", route = ""] = entry.titlePath.slice(-3);
    lines.push(
      `| ${escapeCell(mode)} | ${escapeCell(viewport)} | ${escapeCell(route)} | ${escapeCell(entry.status)} | ${escapeCell(entry.errorMessage || "—")} | ${escapeCell(formatRelativeFile(entry.screenshot) || "—")} |`,
    );
  }

  return { markdown: `${lines.join("\n")}\n`, summary };
}

try {
  if (rawOutput.length === 0) {
    throw new Error("Playwright returned no JSON output.");
  }

  const report = JSON.parse(rawOutput);
  const entries = collectSpecResults(report.suites ?? []);
  const { markdown, summary } = renderMarkdown(entries);
  const reportJson = {
    generated_at: new Date().toISOString(),
    summary,
    cases: entries.map((entry) => ({
      mode: entry.titlePath.at(-3) ?? "",
      viewport: entry.titlePath.at(-2) ?? "",
      route: entry.titlePath.at(-1) ?? "",
      status: entry.status,
      failure: entry.errorMessage,
      screenshot: formatRelativeFile(entry.screenshot),
      duration_ms: entry.durationMs,
    })),
  };

  fs.writeFileSync(reportJsonPath, JSON.stringify(reportJson, null, 2));
  fs.writeFileSync(ledgerJsonPath, JSON.stringify(reportJson, null, 2));
  fs.writeFileSync(ledgerMarkdownPath, markdown);

  const failedEntries = entries.filter((entry) => entry.status !== "passed");
  if (failedEntries.length > 0) {
    console.error(`Responsive audit completed with ${failedEntries.length} failing case(s).`);
    for (const entry of failedEntries.slice(0, 10)) {
      const [mode = "", viewport = "", route = ""] = entry.titlePath.slice(-3);
      console.error(`- ${mode} / ${viewport} / ${route}: ${entry.errorMessage || entry.status}`);
    }
    process.exit(result.status ?? 1);
  }

  console.log(`Responsive audit passed: ${summary.total} case(s).`);
  process.exit(result.status ?? 0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fs.writeFileSync(
    path.join(resultsDir, "raw-output.log"),
    `${rawOutput}\n${result.stderr ?? ""}`,
  );
  console.error(message);
  if (result.stderr) {
    console.error(result.stderr);
  }
  process.exit(result.status ?? 1);
}
