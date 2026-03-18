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
    docs: {
      description: {
        component: "8px grid. Use --spacing-* or --space-* tokens.",
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
        <GroupLabel>Spacing tokens (ascending)</GroupLabel>
        <TokenGrid>
          {SPACING_ORDER.map((key) => {
            const token = SPACING_TOKENS[key];
            const value = resolveToken(token);
            return (
              <TokenSlot key={key} label={token} value={value}>
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
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};
