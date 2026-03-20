import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TYPOGRAPHY_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  resolveToken,
} from "./foundationShared";

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
  title: "Foundations/Typography",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Typography scale and sample text for the miniapp design system. Use `--typo-*` tokens for font-size and keep line-height, weight, and family token-driven.",
      },
    },
  },
};
export default meta;

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Size tokens</GroupLabel>
        <TokenGrid>
          {TYPO_SIZE_TOKENS.map((token) => (
            <TokenSlot
              key={token}
              label={token}
              value={resolveToken(token)}
            >
              <TypographySample token={token} />
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
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
    <TypographySample token={size} weight={weight} />
  ),
};

function TypographySample({
  token,
  weight = 400,
}: {
  token: string;
  weight?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        padding: 8,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: `var(${token})`,
          fontWeight: weight,
          color: "var(--color-text)",
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        The quick brown fox
      </p>
    </div>
  );
}
