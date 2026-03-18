import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FOUNDATION,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Radius",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Border radius tokens. Use --radius-*.",
      },
    },
  },
};
export default meta;

const radiusKeys = Object.keys(RADIUS_TOKENS) as Array<keyof typeof RADIUS_TOKENS>;

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Radius tokens</GroupLabel>
        <TokenGrid>
          {radiusKeys.map((key) => (
            <TokenSlot key={key} label={RADIUS_TOKENS[key]}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: `var(${RADIUS_TOKENS[key]})`,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                }}
              />
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};
