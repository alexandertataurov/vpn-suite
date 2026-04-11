import "../lib/load-env.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fg from "fast-glob";
import { z } from "zod";
import { resolveUnderRoot } from "../lib/safe-path.ts";

const execAsync = promisify(exec);

function requireProjectPath(): string {
  const p = process.env.PROJECT_PATH?.trim();
  if (!p) {
    throw new Error(
      "PROJECT_PATH is required (export it or set it in mcp-servers/.env from .env.example)"
    );
  }
  return path.resolve(p);
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  let n = 1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") n++;
  }
  return n;
}

async function main(): Promise<void> {
  const projectRoot = requireProjectPath();

  const server = new McpServer({
    name: "filesystem-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "fs_read",
    {
      description: "Read a project file; returns content and line count.",
      inputSchema: z.object({
        path: z.string().describe("Path relative to PROJECT_PATH"),
      }),
    },
    async ({ path: rel }) => {
      const full = resolveUnderRoot(projectRoot, rel);
      const content = await fs.readFile(full, "utf8");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              content,
              lineCount: countLines(content),
            }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "fs_write",
    {
      description: "Write a file; creates parent directories as needed.",
      inputSchema: z.object({
        path: z.string().describe("Path relative to PROJECT_PATH"),
        content: z.string().describe("File contents"),
      }),
    },
    async ({ path: rel, content: body }) => {
      const full = resolveUnderRoot(projectRoot, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, body, "utf8");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ok: true, path: rel }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "fs_patch",
    {
      description:
        "Replace exact string `old` with `new` once; errors if not exactly one match.",
      inputSchema: z.object({
        path: z.string().describe("Path relative to PROJECT_PATH"),
        old: z.string().describe("Exact substring to find once"),
        new: z.string().describe("Replacement"),
      }),
    },
    async ({ path: rel, old: oldStr, new: newStr }) => {
      const full = resolveUnderRoot(projectRoot, rel);
      const original = await fs.readFile(full, "utf8");
      const count = countOccurrences(original, oldStr);
      if (count === 0) {
        throw new Error("`old` not found in file");
      }
      if (count > 1) {
        throw new Error("`old` must match exactly once");
      }
      const updated = original.replace(oldStr, newStr);
      await fs.writeFile(full, updated, "utf8");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ok: true, path: rel, replacements: 1 }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "fs_list",
    {
      description: "List files under a path matching a glob pattern.",
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("Directory relative to PROJECT_PATH (default .)"),
        glob: z
          .string()
          .optional()
          .describe("Glob pattern relative to path (default **/*)"),
      }),
    },
    async ({ path: relPath, glob: globPat }) => {
      const base = resolveUnderRoot(projectRoot, relPath ?? ".");
      const pattern = globPat ?? "**/*";
      const entries = await fg(pattern, {
        cwd: base,
        onlyFiles: true,
        dot: true,
      });
      entries.sort();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(entries) }],
      };
    }
  );

  server.registerTool(
    "fs_run",
    {
      description:
        "Run a shell command with optional working directory (under PROJECT_PATH). Timeout 30s.",
      inputSchema: z.object({
        cmd: z.string().describe("Shell command"),
        cwd: z
          .string()
          .optional()
          .describe("Working directory relative to PROJECT_PATH"),
      }),
    },
    async ({ cmd, cwd: cwdRel }) => {
      const cwd = cwdRel
        ? resolveUnderRoot(projectRoot, cwdRel)
        : projectRoot;
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          cwd,
          timeout: 30_000,
          maxBuffer: 16 * 1024 * 1024,
          shell: "/bin/sh",
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                stdout,
                stderr,
                exitCode: 0,
              }),
            },
          ],
        };
      } catch (e: unknown) {
        const err = e as {
          stdout?: string;
          stderr?: string;
          code?: number;
          killed?: boolean;
          message?: string;
        };
        const stdout = err.stdout ?? "";
        const stderr = err.stderr ?? "";
        const exitCode =
          typeof err.code === "number"
            ? err.code
            : err.killed
              ? -1
              : 1;
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                stdout,
                stderr,
                exitCode,
                error: err.message,
              }),
            },
          ],
          isError: exitCode !== 0,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) {
    throw new Error("`old` must be non-empty");
  }
  let count = 0;
  let pos = 0;
  while (pos <= haystack.length - needle.length) {
    if (haystack.startsWith(needle, pos)) {
      count++;
      pos += needle.length;
    } else {
      pos++;
    }
  }
  return count;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
