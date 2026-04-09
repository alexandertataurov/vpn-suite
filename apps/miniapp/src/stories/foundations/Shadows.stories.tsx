import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationSquarePreview,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Shadows",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Elevation shadow tokens for cards, panels, and overlays. Use `--shadow-*` to keep depth consistent across light and dark surfaces.",
      },
    },
  },
};
export default meta;

const shadowKeys = Object.keys(SHADOW_TOKENS) as Array<keyof typeof SHADOW_TOKENS>;

export const Scale: StoryObj = {
  name: "Scale",
  parameters: {
    docs: {
      description: {
        story: "Shadow scale for cards, panels, and overlays across both themes.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Shadow tokens</GroupLabel>
        <TokenGrid>
          {shadowKeys.map((key) => (
            <TokenSlot key={key} label={SHADOW_TOKENS[key]}>
              <ShadowSwatch token={SHADOW_TOKENS[key]} />
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

function ShadowSwatch({ token }: { token: string }) {
  return <FoundationSquarePreview style={{ boxShadow: `var(${token})` }} />;
}
