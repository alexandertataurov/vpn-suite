import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_TOKENS, BREAKPOINT_PX } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationCodePreview,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Layout",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Responsive breakpoint tokens for the miniapp shell. Use `--breakpoint-*` and `--adaptive-bp-*` to keep viewport logic aligned with the design system.",
      },
    },
  },
};
export default meta;

const bpKeys = Object.keys(BREAKPOINT_TOKENS) as Array<keyof typeof BREAKPOINT_TOKENS>;

export const Tokens: StoryObj = {
  parameters: {
    docs: {
      description: {
        story: "Breakpoint tokens mirror the responsive shell thresholds used by the miniapp.",
      },
    },
  },
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
              <BreakpointSwatch
                value={`${BREAKPOINT_PX[key.replace(/^bp/, "").toLowerCase() as keyof typeof BREAKPOINT_PX]}px`}
              />
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

function BreakpointSwatch({ value }: { value: string }) {
  return (
    <FoundationCodePreview minHeight={64}>
      {value}
    </FoundationCodePreview>
  );
}
