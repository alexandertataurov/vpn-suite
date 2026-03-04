import type { ReactNode } from "react";
import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Check } from "lucide-react";
import { PrimitiveBadge } from "../../../src/design-system";
import { Button } from "../../../src/design-system";
import "../../prism-setup";

export interface CodeBlockProps {
  language?: string;
  children: ReactNode;
  theme?: "dark" | "light";
  showLineNumbers?: boolean;
}

export function CodeBlock({
  language = "text",
  children,
  theme = "dark",
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const code = (typeof children === "string" ? children : String(children)).trim();

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isDark = theme === "dark";
  const prismTheme = isDark ? themes.vsDark : themes.github;
  const langMap: Record<string, string> = { md: "markdown", ts: "typescript", js: "javascript" };
  const supported = ["tsx", "typescript", "javascript", "jsx", "css", "json", "bash", "markdown", "text"];
  const lang = supported.includes(language) ? (langMap[language] ?? language) : "text";

  return (
    <div
      className="relative my-6 overflow-hidden border font-mono text-sm border-[var(--color-border-subtle)]"
      style={{ background: "var(--color-base)" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 bg-[var(--color-elevated)]">
        <PrimitiveBadge variant="neutral" size="sm">
          {language}
        </PrimitiveBadge>
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy code">
          {copied ? <Check className="h-4 w-4 text-[var(--color-nominal-bright)]" /> : "Copy"}
        </Button>
      </div>
      <Highlight theme={prismTheme} code={code} language={lang}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              margin: 0,
              padding: showLineNumbers ? "var(--space-4) var(--space-5) var(--space-4) var(--space-2)" : "var(--space-4) var(--space-5)",
              overflow: "auto",
              lineHeight: 1.6,
              fontSize: 13,
              background: "var(--color-base)",
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} style={{ display: "flex", gap: 16 }}>
                {showLineNumbers && (
                  <span
                    aria-hidden
                    className="text-[var(--color-text-muted)] select-none"
                    style={{ minWidth: 24, textAlign: "right" }}
                  >
                    {i + 1}
                  </span>
                )}
                <span style={{ flex: 1 }}>{line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}</span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
