import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FOUNDATION,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Motion",
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
    <FoundationSection>
      <div>
        <GroupLabel>Motion tokens</GroupLabel>
        <TokenGrid>
          {motionKeys.map((key) => (
            <TokenSlot
              key={key}
              label={key}
              value={String(MOTION_TOKENS[key])}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: FOUNDATION.cardRadius,
                  background: "var(--color-surface)",
                  border: FOUNDATION.cardBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--color-text)",
                  padding: 8,
                }}
              >
                {String(MOTION_TOKENS[key])}
              </div>
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};
