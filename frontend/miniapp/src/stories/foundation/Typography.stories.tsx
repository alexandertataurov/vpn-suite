import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TYPOGRAPHY_TOKENS } from "@/design-system/core/tokens";

const TYPO_SIZE_TOKENS = [
  TYPOGRAPHY_TOKENS.typoDisplaySize,
  TYPOGRAPHY_TOKENS.typoH1Size,
  TYPOGRAPHY_TOKENS.typoH2Size,
  TYPOGRAPHY_TOKENS.typoH3Size,
  TYPOGRAPHY_TOKENS.typoH4Size,
  TYPOGRAPHY_TOKENS.typoBodySize,
  TYPOGRAPHY_TOKENS.typoBodySmSize,
  TYPOGRAPHY_TOKENS.typoCaptionSize,
  TYPOGRAPHY_TOKENS.typoMetaSize,
] as const;

const meta: Meta = {
  title: "Foundation/Typography",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Typography scale. Use --typo-* tokens for font-size; avoid hardcoded px.",
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

function TypoGroup({ name, tokens }: { name: string; tokens: readonly string[] }) {
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {tokens.map((token) => (
          <div key={token} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: `var(${token})`,
                fontWeight: 400,
                color: "var(--color-text)",
                lineHeight: 1.4,
              }}
            >
              The quick brown fox
            </p>
            <code style={{ fontSize: 10, color: "var(--color-text-tertiary, #aaa)" }}>
              {token}
            </code>
            <code style={{ fontSize: 9, color: "var(--color-text-tertiary, #aaa)" }}>
              {resolveToken(token) || "—"}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <TypoGroup name="Size tokens" tokens={TYPO_SIZE_TOKENS} />
    </div>
  ),
};

const SIZE_OPTIONS = [
  "--typo-display-size",
  "--typo-h1-size",
  "--typo-h2-size",
  "--typo-h3-size",
  "--typo-body-size",
  "--typo-caption-size",
] as const;

export const Sample: StoryObj<{ size: string; weight: number }> = {
  name: "Sample",
  argTypes: {
    size: {
      control: "select",
      options: [...SIZE_OPTIONS],
    },
    weight: {
      control: "inline-radio",
      options: [400, 500, 600, 700],
    },
  },
  args: { size: "--typo-body-size", weight: 400 },
  render: ({ size, weight }) => (
    <p
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: `var(${size})`,
        fontWeight: weight,
        color: "var(--color-text)",
        lineHeight: 1.4,
      }}
    >
      The quick brown fox
    </p>
  ),
};
