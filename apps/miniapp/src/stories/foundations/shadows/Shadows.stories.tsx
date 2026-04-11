import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "@/design-system/foundations";
import {
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationSquarePreview,
  resolveToken,
} from "../shared/foundationShared";

const meta: Meta = {
  title: "Foundations/Shadows",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};
export default meta;

const shadowKeys = Object.keys(SHADOW_TOKENS) as Array<keyof typeof SHADOW_TOKENS>;

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Elevation Scale"
        description="Shadow tokens provide consistent depth cues for surfaces and overlays."
      />
      <FoundationGroup>
        <GroupLabel>Shadow tokens</GroupLabel>
        <TokenGrid>
          {shadowKeys.map((key) => {
            const token = SHADOW_TOKENS[key];
            return (
              <TokenSlot key={token} label={token.replace("--", "")} value={resolveToken(token)}>
                <FoundationSquarePreview style={{ boxShadow: `var(${token})` }} />
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Applied elevation",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Layering Example"
        description="Use the lightest shadow that still communicates separation from surrounding content."
      />
      <FoundationPanel style={{ maxWidth: "34rem", background: "var(--color-surface-2)" }}>
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-surface)",
            padding: "var(--spacing-4)",
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-md)",
            display: "grid",
            gap: "var(--spacing-2)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Elevated sheet</p>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Reserve stronger depth for overlays and modal-level separation.
          </p>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ token: keyof typeof SHADOW_TOKENS; surface: "surface" | "surface-2" }> = {
  name: "Playground",
  argTypes: {
    token: {
      control: "select",
      options: shadowKeys,
    },
    surface: {
      control: "inline-radio",
      options: ["surface", "surface-2"],
    },
  },
  args: {
    token: "md",
    surface: "surface",
  },
  render: ({ token, surface }) => {
    const shadowToken = SHADOW_TOKENS[token];
    const backgroundToken = surface === "surface-2" ? "--color-surface-2" : "--color-surface";

    return (
      <FoundationSection>
        <FoundationIntro
          title="Shadow Playground"
          description="Preview a single elevation token on configurable background surfaces."
        />
        <FoundationPanel>
          <p style={{ margin: 0 }}>
            Token: <code>{shadowToken}</code> = <code>{resolveToken(shadowToken)}</code>
          </p>
          <div
            style={{
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-surface)",
              background: `var(${backgroundToken})`,
              padding: "var(--spacing-5)",
            }}
          >
            <div
              style={{
                width: 220,
                maxWidth: "100%",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-surface)",
                background: "var(--color-surface)",
                boxShadow: `var(${shadowToken})`,
                padding: "var(--spacing-4)",
              }}
            >
              Preview surface
            </div>
          </div>
        </FoundationPanel>
      </FoundationSection>
    );
  },
};
