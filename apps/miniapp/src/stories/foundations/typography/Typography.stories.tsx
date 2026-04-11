import type { Meta, StoryObj } from "@storybook/react";
import { TYPOGRAPHY_TOKENS } from "@/design-system/foundations";
import {
  FoundationGrid,
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  resolveToken,
  FoundationTypographyPreview,
} from "../shared/foundationShared";

const TYPO_SIZE_TOKENS = [
  TYPOGRAPHY_TOKENS.typoDisplaySize,
  TYPOGRAPHY_TOKENS.typoH1Size,
  TYPOGRAPHY_TOKENS.typoH2Size,
  TYPOGRAPHY_TOKENS.typoH3Size,
  TYPOGRAPHY_TOKENS.typoH4Size,
  TYPOGRAPHY_TOKENS.typoBodySize,
  TYPOGRAPHY_TOKENS.typoBodySmSize,
  TYPOGRAPHY_TOKENS.typoCaptionSize,
  TYPOGRAPHY_TOKENS.typoMetaSize,
] as const;

const SIZE_OPTIONS = [
  "--typo-display-size",
  "--typo-h1-size",
  "--typo-h2-size",
  "--typo-h3-size",
  "--typo-body-size",
  "--typo-caption-size",
] as const;

const meta: Meta = {
  title: "Foundations/Typography",
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
        title="Type Scale"
        description="Legible type tokens with a consistent hierarchy from display to metadata."
      />
      <FoundationGroup>
        <GroupLabel>Size tokens</GroupLabel>
        <TokenGrid>
          {TYPO_SIZE_TOKENS.map((token) => (
            <TokenSlot key={token} label={token.replace("--", "")} value={resolveToken(token)}>
              <FoundationTypographyPreview token={token} />
            </TokenSlot>
          ))}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Sample: StoryObj<{ size: string; weight: number }> = {
  name: "Sample",
  argTypes: {
    size: {
      control: "select",
      options: [...SIZE_OPTIONS],
    },
    weight: {
      control: "inline-radio",
      options: [400, 500, 600, 700],
    },
  },
  args: { size: "--typo-body-size", weight: 400 },
  render: ({ size, weight }) => (
    <FoundationSection>
      <FoundationIntro
        title="Token Sample"
        description="Preview a single size token and weight combination in a stable stateless canvas."
      />
      <FoundationPanel style={{ maxWidth: "28rem" }}>
        <FoundationTypographyPreview token={size} weight={weight}>
          VPN setup instructions should stay clear under real reading conditions.
        </FoundationTypographyPreview>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const Applied: StoryObj = {
  name: "Applied typography",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Applied Hierarchy"
        description="Titles lead, body clarifies, and metadata stays visually secondary."
      />
      <FoundationPanel style={{ maxWidth: "34rem" }}>
        <p style={{ margin: 0, fontSize: "var(--typo-h2-size)", fontWeight: 600, lineHeight: 1.25 }}>
          Protect every device with one plan
        </p>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--typo-body-size)", lineHeight: 1.5 }}>
          Supporting copy should explain the next decision without competing with the main heading.
        </p>
        <p style={{ margin: 0, fontSize: "var(--typo-caption-size)", color: "var(--color-text-tertiary)" }}>
          Synced 2 minutes ago
        </p>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const HierarchyChecklist: StoryObj = {
  name: "Hierarchy checklist",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Reading Order Checklist"
        description="Quick validation rules to keep typography calm and predictable across screens."
      />
      <FoundationGrid>
        <FoundationPanel>
          <GroupLabel>Primary</GroupLabel>
          <p style={{ margin: 0 }}>A heading should communicate the main decision or status immediately.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Supporting</GroupLabel>
          <p style={{ margin: 0 }}>Body text should reduce uncertainty and explain consequences.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Meta</GroupLabel>
          <p style={{ margin: 0 }}>Caption and metadata should remain readable but clearly secondary.</p>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};
