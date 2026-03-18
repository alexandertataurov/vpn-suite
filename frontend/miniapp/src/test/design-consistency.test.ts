/**
 * Design consistency tests — programmatic enforcement of design-system rules.
 * Complements design-check.sh; runs in CI via `pnpm run test`.
 * See: .cursor/rules/design-system.mdc, docs/frontend/design/amnezia-miniapp-design-guidelines.md
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

// Vitest runs from miniapp root; use cwd for file-scanning tests
const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const STYLES_DIR = join(SRC, "design-system", "styles");

const ALLOWED_ROOT = [
  join(STYLES_DIR, "tokens", "base.css"),
  join(STYLES_DIR, "theme", "consumer.css"),
  join(STYLES_DIR, "shell", "frame.css"),
];

const ALLOWED_HEX_CSS = [
  join(STYLES_DIR, "tokens", "base.css"),
  join(STYLES_DIR, "theme", "consumer.css"),
  join(STYLES_DIR, "theme", "telegram.css"),
  join(STYLES_DIR, "theme", "amnezia.css"),
  join(STYLES_DIR, "shell", "frame.css"),
];

function* walkDir(dir: string, ext: string[]): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && !e.name.startsWith(".")) {
        yield* walkDir(p, ext);
      }
    } else if (ext.some((x) => e.name.endsWith(x))) {
      yield p;
    }
  }
}

function rel(p: string) {
  return relative(ROOT, p);
}

describe("Design consistency", () => {
  describe("1. Single :root source", () => {
    it("only allowed token files define :root", () => {
      const violations: string[] = [];
      for (const f of walkDir(SRC, [".css"])) {
        const content = readFileSync(f, "utf8");
        if (/^:root\s*\{/m.test(content)) {
          const allowed = ALLOWED_ROOT.some((a) => f === a || f.startsWith(a + "/"));
          if (!allowed) {
            violations.push(rel(f));
          }
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("2. No inline styles in app TSX", () => {
    it("app TSX files use CSS classes, not style={{}}", () => {
      const violations: string[] = [];
      for (const f of walkDir(SRC, [".tsx"])) {
        if (f.endsWith(".stories.tsx") || f.includes("story-helpers")) continue;
        const content = readFileSync(f, "utf8");
        if (/style=\s*\{\{/.test(content)) {
          violations.push(rel(f));
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("3. No direct lucide-react imports", () => {
    it("only src/lib/icons.ts imports lucide-react", () => {
      const iconsPath = join(SRC, "lib", "icons.ts");
      const violations: string[] = [];
      for (const f of walkDir(SRC, [".ts", ".tsx"])) {
        if (f === iconsPath) continue;
        const content = readFileSync(f, "utf8");
        if (/from\s+["']lucide-react["']/.test(content)) {
          violations.push(rel(f));
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("4. No raw hex/rgba in design-system CSS", () => {
    it("only token source files contain hex or rgba", () => {
      const hexRgba = /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba\s*\(/;
      const violations: string[] = [];
      for (const f of walkDir(STYLES_DIR, [".css"])) {
        const allowed = ALLOWED_HEX_CSS.some((a) => f === a);
        if (allowed) continue;
        const content = readFileSync(f, "utf8");
        if (hexRgba.test(content)) {
          violations.push(rel(f));
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("5. No page-local stylesheets", () => {
    it("pages directory has no CSS files", () => {
      const pagesDir = join(SRC, "pages");
      const cssFiles: string[] = [];
      try {
        for (const f of walkDir(pagesDir, [".css"])) {
          cssFiles.push(rel(f));
        }
      } catch {
        // pages may not exist
      }
      expect(cssFiles).toEqual([]);
    });

    it("pages do not import local CSS", () => {
      const violations: string[] = [];
      const pagesDir = join(SRC, "pages");
      try {
        for (const f of walkDir(pagesDir, [".tsx", ".ts"])) {
          const content = readFileSync(f, "utf8");
          if (/import\s+["']\.\/[^"']+\.css["']/.test(content)) {
            violations.push(rel(f));
          }
        }
      } catch {
        // ignore
      }
      expect(violations).toEqual([]);
    });
  });

  describe("6. No page ancestor selectors in design-system CSS", () => {
    it("design-system CSS does not use page-family selectors", () => {
      const pageSelectors = /\.(home-page|settings-page|devices-page|support-page|onboarding-page)\b/;
      const violations: string[] = [];
      for (const f of walkDir(STYLES_DIR, [".css"])) {
        const content = readFileSync(f, "utf8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (pageSelectors.test(lines[i])) {
            violations.push(`${rel(f)}:${i + 1}`);
          }
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("7. Pages import from @/design-system", () => {
    it("pages and page-models use public design-system entrypoint, not deep paths", () => {
      const deepImport =
        /from\s+["']@\/design-system\/(components|layouts|recipes|patterns|primitives)\/[^"']+["']/g;
      const allowedPaths = [
        "patterns/FallbackScreen",
        "patterns/PageStateScreen",
        "layouts/PageScaffold",
      ];
      const violations: string[] = [];
      for (const sub of ["pages", "page-models"]) {
        const dir = join(SRC, sub);
        try {
          for (const f of walkDir(dir, [".ts", ".tsx"])) {
            const content = readFileSync(f, "utf8");
            const matches = content.match(deepImport) ?? [];
            const bad = matches.filter(
              (m) => !allowedPaths.some((a) => m.includes(a))
            );
            if (bad.length > 0) violations.push(rel(f));
          }
        } catch {
          // dir may not exist
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("8. Amnezia theme tokens", () => {
    it("amnezia.css defines required semantic tokens", () => {
      const amneziaPath = join(STYLES_DIR, "theme", "amnezia.css");
      const content = readFileSync(amneziaPath, "utf8");
      const required = [
        "--bg",
        "--white",
        "--text",
        "--text2",
        "--text3",
        "--border",
        "--green",
        "--amber",
        "--red",
        "--r",
        "--r-sm",
        "--amnezia-page-pad-h",
        "--amnezia-card-gap",
        "--amnezia-plan-name",
        "--amnezia-profile-name",
      ];
      const missing = required.filter((t) => !content.includes(t));
      expect(missing).toEqual([]);
    });
  });

  describe("9. Token files exist and contain expected keys", () => {
    const tokenChecks: Array<{ file: string; keys: string[] }> = [
      {
        file: join(SRC, "design-system", "core", "tokens", "zIndex.ts"),
        keys: ["dropdown", "overlay", "modal", "toast", "header", "nav", "scanline"],
      },
      {
        file: join(SRC, "design-system", "core", "tokens", "motion.ts"),
        keys: ["tap", "micro", "enter", "exit", "panel", "sheet"],
      },
      {
        file: join(SRC, "design-system", "core", "tokens", "radius.ts"),
        keys: ["none", "sm", "md", "lg", "xl", "2xl", "full", "control", "surface", "button"],
      },
      {
        file: join(SRC, "design-system", "core", "tokens", "shadows.ts"),
        keys: ["none", "sm", "md", "lg", "card", "focusRing"],
      },
    ];

    for (const { file, keys } of tokenChecks) {
      it(`${relative(SRC, file)} contains expected keys`, () => {
        const content = readFileSync(file, "utf8");
        const missing = keys.filter((k) => !content.includes(k));
        expect(missing).toEqual([]);
      });
    }
  });

  describe("10. Design-system exports Amnezia recipe components", () => {
    it("recipes index exports PlanHeroCard, RenewalBanner, NoDeviceCallout, NewUserHero", () => {
      const recipesIndex = readFileSync(
        join(SRC, "design-system", "compositions", "recipes", "index.ts"),
        "utf8"
      );
      const required = ["PlanHeroCard", "RenewalBanner", "NoDeviceCallout", "NewUserHero"];
      const missing = required.filter((name) => !recipesIndex.includes(name));
      expect(missing).toEqual([]);
    });

    it("patterns index exports PillChip", () => {
      const patternsIndex = readFileSync(
        join(SRC, "design-system", "compositions", "patterns", "index.ts"),
        "utf8"
      );
      expect(patternsIndex).toContain("PillChip");
    });
  });

  describe("11. Design-system styles import amnezia theme", () => {
    it("styles index imports amnezia.css", () => {
      const stylesIndex = readFileSync(
        join(SRC, "design-system", "styles", "index.css"),
        "utf8"
      );
      expect(stylesIndex).toMatch(/amnezia\.css/);
    });
  });

  describe("12. No hardcoded hex in app TSX/TS", () => {
    it("app and page-model code does not use raw hex colors", () => {
      const hex = /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/;
      const violations: string[] = [];
      const appDirs = [join(SRC, "pages"), join(SRC, "page-models"), join(SRC, "components")];
      for (const dir of appDirs) {
        try {
          for (const f of walkDir(dir, [".tsx", ".ts"])) {
            if (f.endsWith(".test.ts") || f.endsWith(".test.tsx")) continue;
            const content = readFileSync(f, "utf8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (/^\s*(\/\/|\*)/.test(line.trim())) continue;
              const match = line.match(hex);
              if (match) violations.push(`${rel(f)}:${i + 1}`);
            }
          }
        } catch {
          // dir may not exist
        }
      }
      expect(violations).toEqual([]);
    });
  });
});
