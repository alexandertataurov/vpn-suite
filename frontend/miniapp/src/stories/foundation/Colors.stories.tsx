import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundation/Colors",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Semantic color tokens. Use these in product code; avoid raw hex/RGB.",
      },
    },
  },
};
export default meta;

function resolveToken(token: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

function Swatch({ token }: { token: string }) {
  const value = resolveToken(token);
  const isLight = token.includes("on-accent") || token.includes("overlay");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: 80 }}>
      <div
        title={value}
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: `var(${token})`,
          backgroundImage: isLight
            ? `linear-gradient(45deg, #ddd 25%, transparent 25%),
               linear-gradient(-45deg, #ddd 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #ddd 75%),
               linear-gradient(-45deg, transparent 75%, #ddd 75%),
               var(${token})`
            : undefined,
          backgroundSize: isLight ? "8px 8px, 8px 8px, 8px 8px, 8px 8px, 100%" : undefined,
          backgroundPosition: isLight ? "0 0, 0 4px, 4px -4px, -4px 0px, 0 0" : undefined,
          border: "1px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
      <code style={{ fontSize: 10, color: "var(--color-text-muted, #888)", lineHeight: 1.4 }}>
        {token.replace("--color-", "")}
      </code>
      <code style={{ fontSize: 9, color: "var(--color-text-tertiary, #aaa)", lineHeight: 1.4 }}>
        {value || "—"}
      </code>
    </div>
  );
}

function SwatchGroup({ name, tokens }: { name: string; tokens: string[] }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--color-text-tertiary, #888)",
          marginBottom: 12,
        }}
      >
        {name}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {tokens.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </div>
    </div>
  );
}

const COLOR_GROUPS: Record<string, string[]> = {
  Surfaces: ["--color-bg", "--color-surface", "--color-surface-2", "--color-overlay"],
  Text: ["--color-text", "--color-text-muted", "--color-text-tertiary"],
  Borders: ["--color-border", "--color-border-subtle", "--color-border-strong"],
  Accent: ["--color-accent", "--color-accent-hover", "--color-on-accent"],
  Semantic: ["--color-success", "--color-warning", "--color-error", "--color-info"],
};

export const All: StoryObj = {
  name: "All tokens",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {Object.entries(COLOR_GROUPS).map(([name, tokens]) => (
        <SwatchGroup key={name} name={name} tokens={tokens} />
      ))}
    </div>
  ),
};
