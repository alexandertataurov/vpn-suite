import "../lib/load-env.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Dirent } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { resolveUnderRoot, toPosixRelative } from "../lib/safe-path.js";

function requireVaultPath(): string {
  const p = process.env.VAULT_PATH?.trim();
  if (!p) {
    throw new Error(
      "VAULT_PATH is required (export it or set it in mcp-servers/.env from .env.example)"
    );
  }
  return path.resolve(p);
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === ".git" || ent.name === ".obsidian") continue;
        await walk(full);
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

function excerptAround(text: string, query: string, radius = 80): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return text.slice(0, radius * 2).replace(/\s+/g, " ").trim();
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let s = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) s = "…" + s;
  if (end < text.length) s = s + "…";
  return s;
}

function extractSection(markdown: string, title: string): string {
  const lines = markdown.split(/\r?\n/);
  const heading = `## ${title}`;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === heading) {
      i++;
      const buf: string[] = [];
      while (i < lines.length && !/^##\s/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      return buf.join("\n").trim();
    }
    i++;
  }
  return "";
}

function parseTaskBody(content: string) {
  return {
    goal: extractSection(content, "Goal"),
    context: extractSection(content, "Context"),
    acceptance: extractSection(content, "Acceptance criteria"),
    prompt:
      extractSection(content, "Prompt (copy-paste to agent)") ||
      extractSection(content, "Prompt"),
  };
}

async function main(): Promise<void> {
  const vaultRoot = requireVaultPath();

  const server = new McpServer({
    name: "obsidian-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "vault_read",
    {
      description: "Read a vault note by relative path; returns raw markdown.",
      inputSchema: z.object({
        path: z.string().describe("Relative path inside the vault"),
      }),
    },
    async ({ path: rel }) => {
      const full = resolveUnderRoot(vaultRoot, rel);
      const raw = await fsp.readFile(full, "utf8");
      return {
        content: [{ type: "text" as const, text: raw }],
      };
    }
  );

  server.registerTool(
    "vault_write",
    {
      description: "Create or overwrite a note in the vault.",
      inputSchema: z.object({
        path: z.string().describe("Relative path inside the vault"),
        content: z.string().describe("Full markdown body"),
      }),
    },
    async ({ path: rel, content: body }) => {
      const full = resolveUnderRoot(vaultRoot, rel);
      await fsp.mkdir(path.dirname(full), { recursive: true });
      await fsp.writeFile(full, body, "utf8");
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
    "vault_search",
    {
      description: "Full-text search across all .md files in the vault.",
      inputSchema: z.object({
        query: z.string().describe("Substring to search for"),
      }),
    },
    async ({ query }) => {
      if (!query) {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify([]) },
          ],
        };
      }
      const files = await walkMarkdownFiles(vaultRoot);
      const hits: { path: string; excerpt: string }[] = [];
      for (const file of files) {
        const text = await fsp.readFile(file, "utf8");
        if (text.toLowerCase().includes(query.toLowerCase())) {
          hits.push({
            path: toPosixRelative(vaultRoot, file),
            excerpt: excerptAround(text, query),
          });
        }
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(hits) }],
      };
    }
  );

  server.registerTool(
    "vault_list",
    {
      description: "List .md notes under a folder (vault-relative).",
      inputSchema: z.object({
        folder: z
          .string()
          .optional()
          .describe("Folder relative to vault root; omit for entire vault"),
      }),
    },
    async ({ folder }) => {
      const base = resolveUnderRoot(vaultRoot, folder ?? ".");
      const files = await walkMarkdownFiles(base);
      const rels = files.map((f) => toPosixRelative(vaultRoot, f));
      rels.sort();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(rels) }],
      };
    }
  );

  server.registerTool(
    "task_next",
    {
      description:
        "Return the first active task note with status todo (sorted by filename).",
      inputSchema: z.object({}),
    },
    async () => {
      const activeDir = resolveUnderRoot(vaultRoot, "04-tasks/active");
      let names: string[];
      try {
        names = await fsp.readdir(activeDir);
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === "ENOENT") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(null),
              },
            ],
          };
        }
        throw e;
      }
      const mdFiles = names.filter((n) => n.endsWith(".md")).sort();
      for (const name of mdFiles) {
        const full = path.join(activeDir, name);
        const raw = await fsp.readFile(full, "utf8");
        const parsed = matter(raw);
        const status = String(parsed.data?.status ?? "").toLowerCase().trim();
        if (status !== "todo") continue;
        const body = parseTaskBody(parsed.content);
        const filesField = Array.isArray(parsed.data?.files)
          ? (parsed.data.files as unknown[]).map(String)
          : [];
        const task = {
          goal: body.goal,
          context: body.context,
          acceptance: body.acceptance,
          prompt: body.prompt,
          files: filesField,
        };
        return {
          content: [{ type: "text" as const, text: JSON.stringify(task) }],
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(null) }],
      };
    }
  );

  server.registerTool(
    "task_done",
    {
      description:
        "Set task frontmatter status to done and move the file to 04-tasks/done/.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Vault-relative path to a file in 04-tasks/active/"),
      }),
    },
    async ({ path: rel }) => {
      const full = resolveUnderRoot(vaultRoot, rel);
      const activePrefix = resolveUnderRoot(vaultRoot, "04-tasks/active") + path.sep;
      if (!full.startsWith(activePrefix)) {
        throw new Error("task_done only accepts files under 04-tasks/active/");
      }
      const raw = await fsp.readFile(full, "utf8");
      const parsed = matter(raw);
      parsed.data = { ...parsed.data, status: "done" };
      const out = matter.stringify(parsed.content, parsed.data);
      const base = path.basename(full);
      const destDir = resolveUnderRoot(vaultRoot, "04-tasks/done");
      await fsp.mkdir(destDir, { recursive: true });
      const dest = path.join(destDir, base);
      try {
        await fsp.writeFile(dest, out, { flag: "wx" });
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === "EEXIST") {
          throw new Error(`Destination already exists: 04-tasks/done/${base}`);
        }
        throw e;
      }
      await fsp.unlink(full);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ok: true,
              from: rel,
              to: `04-tasks/done/${base}`,
            }),
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
