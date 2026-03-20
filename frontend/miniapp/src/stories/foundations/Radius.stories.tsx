import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationSquarePreview,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Radius",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Border radius tokens for surfaces, buttons, cards, and overlays. Use `--radius-*` rather than hardcoded pixel values so shape stays consistent.",
      },
    },
  },
};
export default meta;

const radiusKeys = Object.keys(RADIUS_TOKENS) as Array<keyof typeof RADIUS_TOKENS>;

const RADIUS_EXTRA: Array<{ token: string; px: string }> = [
  { token: "--r", px: "14px" },
  { token: "--r-sm", px: "10px" },
];

export const Scale: StoryObj = {
  name: "Scale",
  parameters: {
    docs: {
      description: {
        story: "Radius scale used by cards, buttons, and elevated surfaces.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Radius tokens</GroupLabel>
        <TokenGrid>
          {RADIUS_EXTRA.map(({ token, px }) => (
            <TokenSlot key={token} label={`${token} (${px})`}>
              <RadiusSwatch token={token} />
            </TokenSlot>
          ))}
          {radiusKeys.map((key) => (
            <TokenSlot key={key} label={RADIUS_TOKENS[key]}>
              <RadiusSwatch token={RADIUS_TOKENS[key]} />
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

function RadiusSwatch({ token }: { token: string }) {
  return (
    <FoundationSquarePreview
      style={{
        borderRadius: `var(${token})`,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}
