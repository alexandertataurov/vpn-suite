import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS } from "@/design-system/core/tokens";

const SPACING_ORDER: Array<keyof typeof SPACING_TOKENS> = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
];

const meta: Meta = {
  title: "Foundation/Spacing",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "8px grid. Use --spacing-* or --space-* tokens.",
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

function SpacingBar({ token }: { token: string }) {
  const value = resolveToken(token);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          height: 8,
          width: `var(${token})`,
          minWidth: `var(${token})`,
          background: "var(--color-accent)",
          opacity: 0.5,
          borderRadius: "var(--radius-sm)",
        }}
      />
      <code style={{ fontSize: 10, color: "var(--color-text-tertiary, #aaa)" }}>
        {token} {value ? `→ ${value}` : ""}
      </code>
    </div>
  );
}

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
        Spacing tokens (ascending)
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>
        {SPACING_ORDER.map((key) => (
          <SpacingBar key={key} token={SPACING_TOKENS[key]} />
        ))}
      </div>
    </div>
  ),
};
