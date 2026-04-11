import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS } from "@/design-system/foundations";
import {
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  resolveToken,
  FoundationBarPreview,
} from "../shared/foundationShared";

const SPACING_ORDER: Array<keyof typeof SPACING_TOKENS> = ["1", "2", "3", "4", "5", "6", "8", "10", "12"];

const meta: Meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};
export default meta;

export const Scale: StoryObj = {
  name: "Scale",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Spacing Scale"
        description="Consistent spacing tokens keep alignment, rhythm, and touch target flow stable."
      />
      <FoundationGroup>
        <GroupLabel>Spacing tokens</GroupLabel>
        <TokenGrid>
          {SPACING_ORDER.map((key) => {
            const token = SPACING_TOKENS[key];
            return (
              <TokenSlot key={token} label={token.replace("--", "")} value={resolveToken(token)}>
                <FoundationBarPreview token={token} />
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Live spacing rhythm",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Applied Rhythm"
        description="Insets, block spacing, and row gaps all use the same spacing scale."
      />
      <FoundationPanel style={{ maxWidth: "32rem" }}>
        <div style={{ display: "grid", gap: "var(--spacing-1)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Plan details</p>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Space between sections should be larger than space inside each section.
          </p>
        </div>
        <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
          {["Device coverage", "Billing history", "Renewal date"].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-surface)",
                background: "var(--color-surface-2)",
                padding: "var(--spacing-3)",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const TouchTargets: StoryObj = {
  name: "Touch target spacing",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Touch Target Baseline"
        description="Interactive controls keep at least 48px height and clear horizontal breathing room."
      />
      <FoundationPanel style={{ maxWidth: "32rem" }}>
        <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
          {["1 month", "6 months", "12 months"].map((label) => (
            <button
              key={label}
              type="button"
              style={{
                minHeight: 48,
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                padding: "0 14px",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

type SpacingKey = keyof typeof SPACING_TOKENS;

export const Playground: StoryObj<{ gapKey: SpacingKey; paddingKey: SpacingKey }> = {
  name: "Interactive · spacing playground",
  argTypes: {
    gapKey: { control: "select", options: SPACING_ORDER },
    paddingKey: { control: "select", options: SPACING_ORDER },
  },
  args: { gapKey: "2", paddingKey: "4" },
  render: ({ gapKey, paddingKey }) => {
    const gapToken = SPACING_TOKENS[gapKey];
    const paddingToken = SPACING_TOKENS[paddingKey];

    return (
      <FoundationSection>
        <FoundationIntro
          title="Spacing Playground"
          description="Compare spacing combinations without local component state."
        />
        <FoundationPanel>
          <p style={{ margin: 0 }}>
            Gap: <code>{gapToken}</code> = <code>{resolveToken(gapToken)}</code>
          </p>
          <p style={{ margin: 0 }}>
            Padding: <code>{paddingToken}</code> = <code>{resolveToken(paddingToken)}</code>
          </p>
          <div
            style={{
              display: "grid",
              gap: `var(${gapToken})`,
              padding: `var(${paddingToken})`,
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-surface)",
              background: "var(--color-surface-2)",
            }}
          >
            <div>Block A</div>
            <div>Block B</div>
            <div>Block C</div>
          </div>
        </FoundationPanel>
      </FoundationSection>
    );
  },
};
