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
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Responsive breakpoint tokens for the miniapp shell. Use `--breakpoint-*` or `--adaptive-bp-*` rather than hardcoding viewport cutoffs.",
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
      {value}
    </div>
  );
}
