import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_TOKENS, BREAKPOINT_PX } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FOUNDATION,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Layout",
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
    <FoundationSection>
      <div>
        <GroupLabel>Breakpoints</GroupLabel>
        <TokenGrid>
          {bpKeys.map((key) => (
            <TokenSlot
              key={key}
              label={BREAKPOINT_TOKENS[key as keyof typeof BREAKPOINT_TOKENS]}
              value={`${BREAKPOINT_PX[key.replace(/^bp/, "").toLowerCase() as keyof typeof BREAKPOINT_PX]}px`}
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
                }}
              >
                {`${BREAKPOINT_PX[key.replace(/^bp/, "").toLowerCase() as keyof typeof BREAKPOINT_PX]}px`}
              </div>
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};
