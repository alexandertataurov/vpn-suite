import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_PX, BREAKPOINT_TOKENS } from "@/design-system/foundations";
import {
  FoundationCodePreview,
  FoundationGrid,
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
} from "../shared/foundationShared";

const meta: Meta = {
  title: "Foundations/Layout",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};
export default meta;

const BREAKPOINT_ENTRIES = [
  ["sm", BREAKPOINT_TOKENS.bpSm, BREAKPOINT_PX.sm],
  ["md", BREAKPOINT_TOKENS.bpMd, BREAKPOINT_PX.md],
  ["lg", BREAKPOINT_TOKENS.bpLg, BREAKPOINT_PX.lg],
  ["xl", BREAKPOINT_TOKENS.bpXl, BREAKPOINT_PX.xl],
] as const;

const BREAKPOINT_KEYS = ["sm", "md", "lg", "xl"] as const;
type BreakpointKey = (typeof BREAKPOINT_KEYS)[number];

export const Tokens: StoryObj = {
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Breakpoint Tokens"
        description="Shared breakpoint thresholds for responsive layout decisions in CSS and JS."
      />
      <FoundationGroup>
        <GroupLabel>Breakpoint scale</GroupLabel>
        <TokenGrid>
          {BREAKPOINT_ENTRIES.map(([name, token, px]) => (
            <TokenSlot key={token} label={token.replace("--", "")} value={`${px}px`} usage={`${name.toUpperCase()} breakpoint`}>
              <FoundationCodePreview minHeight={64}>{px}px</FoundationCodePreview>
            </TokenSlot>
          ))}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Live grid showcase",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Layout Composition"
        description="Grid density increases with room but keeps readable text width and stable alignment."
      />
      <FoundationPanel style={{ maxWidth: "44rem" }}>
        <div style={{ display: "grid", gap: "var(--spacing-3)", gridTemplateColumns: "2fr 1fr" }}>
          <div
            style={{
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-surface)",
              minHeight: 180,
              background: "var(--color-surface-2)",
              padding: "var(--spacing-3)",
            }}
          >
            Primary content region
          </div>
          <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
            {"Status,Usage,Region".split(",").map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-surface)",
                  minHeight: 52,
                  background: "var(--color-surface)",
                  display: "grid",
                  alignItems: "center",
                  padding: "0 var(--spacing-3)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const ResponsiveChecklist: StoryObj = {
  name: "Responsive checklist",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Viewport Checklist"
        description="Review overflow, scanability, and whitespace at each breakpoint before shipping."
      />
      <FoundationGrid>
        {BREAKPOINT_ENTRIES.map(([name, , px]) => (
          <FoundationPanel key={name}>
            <GroupLabel>{name.toUpperCase()}</GroupLabel>
            <p style={{ margin: 0 }}>Threshold: {px}px</p>
          </FoundationPanel>
        ))}
      </FoundationGrid>
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
  render: ({ breakpointKey }) => {
    const widthPx = BREAKPOINT_PX[breakpointKey];

    return (
      <FoundationSection>
        <FoundationIntro
          title="Container Preview"
          description="Stateless preview of grid behavior at the selected breakpoint width."
        />
        <FoundationPanel>
          <p style={{ margin: 0 }}>
            Breakpoint: <code>{breakpointKey}</code> ({widthPx}px)
          </p>
          <div
            style={{
              width: widthPx,
              maxWidth: "100%",
              display: "grid",
              gap: "var(--spacing-2)",
              gridTemplateColumns: "repeat(auto-fit, minmax(5rem, 1fr))",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-surface)",
                  minHeight: 56,
                  background: "var(--color-surface-2)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                Cell {i + 1}
              </div>
            ))}
          </div>
        </FoundationPanel>
      </FoundationSection>
    );
  },
};
