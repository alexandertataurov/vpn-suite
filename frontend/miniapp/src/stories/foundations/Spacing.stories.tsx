import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FOUNDATION,
  resolveToken,
} from "./foundationShared";

const SPACING_ORDER: Array<keyof typeof SPACING_TOKENS> = [
  "1", "2", "3", "4", "5", "6", "8", "10", "12",
];

const meta: Meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Spacing scale for the 8px grid. Use `--spacing-*` and `--space-*` tokens so layout, padding, and gaps stay consistent across screens.",
      },
    },
  },
};
export default meta;

export const Scale: StoryObj = {
  name: "Scale",
  parameters: {
    docs: {
      description: {
        story: "Ascending spacing values for padding, gaps, and vertical rhythm.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Spacing tokens (ascending)</GroupLabel>
        <TokenGrid>
          {SPACING_ORDER.map((key) => {
            const token = SPACING_TOKENS[key];
            const value = resolveToken(token);
            return (
              <TokenSlot key={key} label={token} value={value}>
                <SpacingSwatch token={token} />
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

function SpacingSwatch({ token }: { token: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: FOUNDATION.cardSize,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          width: `var(${token})`,
          minWidth: `var(${token})`,
          height: 8,
          background: "var(--color-accent)",
          opacity: 0.5,
          borderRadius: "var(--radius-sm)",
        }}
      />
    </div>
  );
}
