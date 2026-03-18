import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_TOKENS } from "@/design-system/core/tokens";

const meta: Meta = {
  title: "Foundation/Motion",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Duration and easing tokens. Use --duration-*, --ease-*.",
      },
    },
  },
};
export default meta;

const motionKeys = Object.keys(MOTION_TOKENS) as Array<keyof typeof MOTION_TOKENS>;

export const Tokens: StoryObj = {
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
        Motion tokens
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {motionKeys.map((key) => (
          <div
            key={key}
            style={{
              padding: "var(--spacing-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--color-text)",
            }}
          >
            {key}: <code>{String(MOTION_TOKENS[key])}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};
