import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationCodePreview,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Motion",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Duration and easing tokens for the miniapp motion system. Use `--duration-*` and `--ease-*` so feedback, overlays, and transitions feel consistent.",
      },
    },
  },
};
export default meta;

const motionKeys = Object.keys(MOTION_TOKENS) as Array<keyof typeof MOTION_TOKENS>;

export const Tokens: StoryObj = {
  parameters: {
    docs: {
      description: {
        story: "Duration and easing tokens for dialogs, banners, and small feedback transitions.",
      },
    },
  },
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
              <FoundationCodePreview minHeight={64}>
                {String(MOTION_TOKENS[key])}
              </FoundationCodePreview>
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};
