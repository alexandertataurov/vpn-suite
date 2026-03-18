import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "@/design-system/core/tokens";

const meta: Meta = {
  title: "Foundation/Shadows",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Shadow tokens. Use --shadow-*.",
      },
    },
  },
};
export default meta;

const shadowKeys = Object.keys(SHADOW_TOKENS) as Array<keyof typeof SHADOW_TOKENS>;

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
        Shadow tokens
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {shadowKeys.map((key) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `var(${SHADOW_TOKENS[key]})`,
              }}
            />
            <code style={{ fontSize: 10, color: "var(--color-text-tertiary, #aaa)" }}>
              {SHADOW_TOKENS[key]}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};
