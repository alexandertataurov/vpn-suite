import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Radius",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Border radius tokens for surfaces, buttons, and overlays. Use `--radius-*` rather than hardcoded pixel values.",
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
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: `var(${token})`,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}
