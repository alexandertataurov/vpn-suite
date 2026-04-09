import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_TOKENS, BREAKPOINT_PX } from "@/design-system/core/tokens";
import { expect, within } from "storybook/test";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationCodePreview,
  FoundationSquarePreview,
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

const BREAKPOINT_KEYS = ["sm", "md", "lg", "xl"] as const;
type BreakpointKey = (typeof BREAKPOINT_KEYS)[number];

export const Showcase: StoryObj = {
  name: "Live grid showcase",
  parameters: {
    docs: {
      description: {
        story: "Breakpoint-aware grid composition showing how container width influences density.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <GroupLabel>Grid composition</GroupLabel>
      <div className="story-preview-card">
        <div className="story-stack story-stack--tight">
          <div className="story-theme-rule-text">
            Container width: <code>{BREAKPOINT_PX.md}px</code>
          </div>
          <div className="layout-story-grid" style={{ width: BREAKPOINT_PX.md }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <FoundationSquarePreview key={i} size={72}>
                <div className="story-label">Cell {i + 1}</div>
              </FoundationSquarePreview>
            ))}
          </div>
        </div>
      </div>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ breakpointKey: BreakpointKey }> = {
  name: "Interactive · layout playground",
  argTypes: {
    breakpointKey: {
      control: "select",
      options: BREAKPOINT_KEYS,
    },
  },
  args: { breakpointKey: "md" },
  parameters: {
    docs: {
      description: {
        story: "Pick a breakpoint token and see the grid density. Includes a play() sanity check.",
      },
    },
  },
  render: ({ breakpointKey }) => {
    const widthPx = BREAKPOINT_PX[breakpointKey];

    return (
      <FoundationSection>
        <GroupLabel>Simulated container</GroupLabel>
        <div className="story-preview-card">
          <div className="story-stack story-stack--tight">
            <div className="story-theme-rule-text">
              Breakpoint: <code>{breakpointKey}</code> ({widthPx}px)
            </div>
            <div
              className="layout-story-grid"
              style={{ width: widthPx }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <FoundationSquarePreview key={i} size={72}>
                  <div className="story-label">Cell {i + 1}</div>
                </FoundationSquarePreview>
              ))}
            </div>
          </div>
        </div>
      </FoundationSection>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Breakpoint:/)).toBeInTheDocument();
    const cells = canvas.getAllByText(/Cell/);
    expect(cells.length).toBe(6);
  },
};
