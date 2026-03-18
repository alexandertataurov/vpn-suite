import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundation/Colors",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
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

function Swatch({ token, usage }: { token: string; usage?: string }) {
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
      {usage && (
        <code style={{ fontSize: 9, color: "var(--color-text-tertiary, #aaa)", lineHeight: 1.4 }}>
          {usage}
        </code>
      )}
    </div>
  );
}

type ColorItem = { token: string; usage: string };

function SwatchGroup({ name, items }: { name: string; items: ColorItem[] }) {
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
        {items.map(({ token, usage }) => (
          <Swatch key={token} token={token} usage={usage} />
        ))}
      </div>
    </div>
  );
}

const COLOR_GROUPS: Record<string, ColorItem[]> = {
  Surfaces: [
    { token: "--color-bg", usage: "Page background" },
    { token: "--color-surface", usage: "Card, modal, panel" },
    { token: "--color-surface-2", usage: "Nested card, input bg" },
    { token: "--color-overlay", usage: "Scrim behind modals" },
  ],
  Text: [
    { token: "--color-text", usage: "Primary text" },
    { token: "--color-text-muted", usage: "Secondary, labels" },
    { token: "--color-text-tertiary", usage: "Placeholder, disabled" },
  ],
  Borders: [
    { token: "--color-border", usage: "Default border" },
    { token: "--color-border-subtle", usage: "Subtle divider" },
    { token: "--color-border-strong", usage: "Emphasis border" },
  ],
  Accent: [
    { token: "--color-accent", usage: "Primary action" },
    { token: "--color-accent-hover", usage: "Hover state" },
    { token: "--color-on-accent", usage: "Text on accent" },
  ],
  Semantic: [
    { token: "--color-success", usage: "Success, connected" },
    { token: "--color-warning", usage: "Warning state" },
    { token: "--color-error", usage: "Error, danger" },
    { token: "--color-info", usage: "Info, neutral" },
  ],
};

export const All: StoryObj = {
  name: "All tokens",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {Object.entries(COLOR_GROUPS).map(([name, items]) => (
        <SwatchGroup key={name} name={name} items={items} />
      ))}
    </div>
  ),
};
