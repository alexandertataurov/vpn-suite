import type { ReactNode } from "react";
import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import "../prism-setup";

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

  const langMap: Record<string, string> = {
    md: "markdown",
    ts: "typescript",
    js: "javascript",
  };
  const supported = ["tsx", "typescript", "javascript", "jsx", "css", "json", "bash", "markdown", "text"];
  const lang = supported.includes(language) ? (langMap[language] ?? language) : "text";

  return (
    <div
      className="relative my-6 overflow-hidden border font-mono text-sm"
      style={{
        background: isDark ? "#0D1117" : "#F4F4F5",
        borderColor: isDark ? "#1C2A38" : "#E4E4E7",
        borderRadius: 0,
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{
          borderColor: isDark ? "#1C2A38" : "#E4E4E7",
          background: isDark ? "#161B22" : "#EEEEF0",
        }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: isDark ? "#6E8499" : "#71717A" }}
        >
          {language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="px-2 py-1 text-xs transition-colors duration-150 hover:bg-[#0EA5E9]/15 hover:text-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:ring-offset-[#0D1117]"
          style={{ color: isDark ? "#A1A1AA" : "#52525B" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Highlight theme={prismTheme} code={code} language={lang}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              margin: 0,
              padding: showLineNumbers ? "16px 20px 16px 8px" : "16px 20px",
              overflow: "auto",
              lineHeight: 1.6,
              fontSize: 13,
            }}
          >
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line })}
                style={{ display: "flex", gap: 16 }}
              >
                {showLineNumbers && (
                  <span
                    aria-hidden
                    style={{
                      minWidth: 24,
                      textAlign: "right",
                      color: isDark ? "#6E8499" : "#71717A",
                      userSelect: "none",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
                <span style={{ flex: 1 }}>
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
