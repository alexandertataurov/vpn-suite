import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_TOKENS, BREAKPOINT_PX } from "@/design-system/core/tokens";

const meta: Meta = {
  title: "Foundation/Breakpoints",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Responsive breakpoints. Use --breakpoint-* or --adaptive-bp-*.",
      },
    },
  },
};
export default meta;

const bpKeys = Object.keys(BREAKPOINT_TOKENS) as Array<keyof typeof BREAKPOINT_TOKENS>;

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
        Breakpoints
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {bpKeys.map((key) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                padding: "var(--spacing-3)",
                minWidth: 64,
                minHeight: 64,
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
              }}
            >
              {`${BREAKPOINT_PX[key.replace(/^bp/, "").toLowerCase() as keyof typeof BREAKPOINT_PX]}px`}
            </div>
            <code style={{ fontSize: 10, color: "var(--color-text-tertiary, #aaa)" }}>
              {`var(${BREAKPOINT_TOKENS[key as keyof typeof BREAKPOINT_TOKENS]})`}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};
