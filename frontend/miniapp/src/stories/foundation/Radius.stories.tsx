import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/core/tokens";

const meta: Meta = {
  title: "Foundation/Radius",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Border radius tokens. Use --radius-*.",
      },
    },
  },
};
export default meta;

const radiusKeys = Object.keys(RADIUS_TOKENS) as Array<keyof typeof RADIUS_TOKENS>;

function RadiusSquare({ token }: { token: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: `var(${token})`,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
        }}
      />
      <code style={{ fontSize: 10, color: "var(--color-text-tertiary, #aaa)" }}>
        {token}
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
        Radius tokens
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {radiusKeys.map((key) => (
          <RadiusSquare key={key} token={RADIUS_TOKENS[key]} />
        ))}
      </div>
    </div>
  ),
};
