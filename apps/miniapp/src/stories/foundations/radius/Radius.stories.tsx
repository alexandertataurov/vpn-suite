import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/foundations";
import {
  FoundationGrid,
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
  title: "Foundations/Radius",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};
export default meta;

const radiusKeys = Object.keys(RADIUS_TOKENS) as Array<keyof typeof RADIUS_TOKENS>;
const RADIUS_EXTRA: Array<{ token: string; px: string }> = [
  { token: "--r", px: "14px" },
  { token: "--r-sm", px: "10px" },
];

const RADIUS_PLAYGROUND_OPTIONS = [
  ...RADIUS_EXTRA.map(({ token }) => token),
  ...radiusKeys.map((key) => RADIUS_TOKENS[key]),
] as const;

function RadiusSwatch({ token }: { token: string }) {
  return (
    <FoundationSquarePreview
      style={{
        borderRadius: `var(${token})`,
        border: "1px solid var(--color-border-subtle)",
        background: "var(--color-surface-2)",
      }}
    />
  );
}

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Radius Scale"
        description="Tokenized corner geometry keeps controls and surfaces visually coherent."
      />
      <FoundationGroup>
        <GroupLabel>Radius tokens</GroupLabel>
        <TokenGrid>
          {RADIUS_EXTRA.map(({ token, px }) => (
            <TokenSlot key={token} label={token.replace("--", "")} value={px}>
              <RadiusSwatch token={token} />
            </TokenSlot>
          ))}
          {radiusKeys.map((key) => {
            const token = RADIUS_TOKENS[key];
            return (
              <TokenSlot key={token} label={token.replace("--", "")} value={resolveToken(token)}>
                <RadiusSwatch token={token} />
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Applied usage",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Shape Hierarchy"
        description="Larger surfaces get softer corners while controls remain tighter and functional."
      />
      <FoundationPanel style={{ maxWidth: "34rem" }}>
        <div
          style={{
            borderRadius: "var(--radius-surface)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "var(--spacing-4)",
            display: "grid",
            gap: "var(--spacing-3)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Plan card</p>
          <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
            <span
              style={{
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-info-border)",
                background: "var(--color-info-bg)",
                padding: "6px 12px",
              }}
            >
              Best value
            </span>
            <button
              type="button"
              style={{
                border: 0,
                borderRadius: "var(--radius-button)",
                background: "var(--color-accent)",
                color: "var(--color-on-accent)",
                padding: "10px 14px",
              }}
            >
              Renew
            </button>
          </div>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ token: string }> = {
  name: "Playground",
  argTypes: {
    token: {
      control: "select",
      options: [...RADIUS_PLAYGROUND_OPTIONS],
    },
  },
  args: {
    token: "--radius-button",
  },
  render: ({ token }) => (
    <FoundationSection>
      <FoundationIntro
        title="Radius Playground"
        description="Apply one radius token across multiple element sizes for consistency review."
      />
      <FoundationPanel>
        <p style={{ margin: 0 }}>
          <code>{token}</code> = <code>{resolveToken(token)}</code>
        </p>
        <FoundationGrid>
          <div
            style={{
              borderRadius: `var(${token})`,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              padding: "10px 14px",
            }}
          >
            Control
          </div>
          <div
            style={{
              borderRadius: `var(${token})`,
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface)",
              padding: "6px 12px",
            }}
          >
            Badge
          </div>
          <div
            style={{
              borderRadius: `var(${token})`,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              padding: "var(--spacing-4)",
            }}
          >
            Surface
          </div>
        </FoundationGrid>
      </FoundationPanel>
    </FoundationSection>
  ),
};
