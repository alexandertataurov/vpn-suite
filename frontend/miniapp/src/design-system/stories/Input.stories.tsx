import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../components/forms/Input";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Components/Input",
  tags: ["autodocs"],
  component: Input,
  parameters: {
    docs: {
      description: {
        component: "Mobile-safe text input with optional label, helper, success, and error handling. When label or helper content is provided, it wraps itself in Field.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
      <StoryPage
        eyebrow="Components"
        title="Input"
        summary="Input is tuned for mobile miniapp forms: visible border, 16px text to avoid iOS zoom, 52px touch target, and in-context helper messaging."
        stats={[
          { label: "Modes", value: "bare + wrapped" },
          { label: "States", value: "default/focused/error/success/disabled" },
          { label: "Examples", value: "6" },
        ]}
    >
      <StorySection
        title="Input states"
        description="The same input primitive should scale from a simple standalone control to a fully labeled field with validation."
      >
        <ThreeColumn>
          <StoryCard title="Bare input" caption="Use when the parent field or layout already provides context.">
            <div style={{ display: "grid", alignItems: "start", minHeight: 52 }}>
              <Input placeholder="Standalone input" />
            </div>
          </StoryCard>
          <StoryCard title="Wrapped input" caption="When label is passed, Input composes itself with Field and helper copy.">
            <Input label="Email" type="email" placeholder="you@example.com" description="We’ll only use this for recovery." required />
          </StoryCard>
          <StoryCard title="Focused state" caption="Focus is the highest-frequency mobile state: 52px touch target, 16px text, accented label, and inset focus ring.">
            <Stack gap="3">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value="you@example.com"
                onChange={() => {}}
                fieldClassName="field--focused-story"
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ValuePill value="16px text" tone="accent" />
                <ValuePill value="52px height" tone="accent" />
              </div>
            </Stack>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Validation separation"
        description="Error and success are distinct states and should not visually merge into one pseudo-form sequence on mobile."
      >
        <TwoColumn>
          <StoryCard title="Error state" caption="Error labels and helper text both participate in the error signal.">
            <Input label="Username" placeholder="username" error="Username is required" />
          </StoryCard>
          <StoryCard title="Success state" caption="Success helper text uses success color, not link color, and the field border stays present but softer than error.">
            <Input label="Device name" value="MacBook Air" onChange={() => {}} success="Saved to your profile." />
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="Inputs often sit in compact onboarding and settings stacks, where density and grouping both matter."
      >
        <UsageExample title="Device naming flow" description="Related fields should read as one logical form group, and example content should not masquerade as a prefilled value.">
          <div style={{ display: "grid", gap: 16, padding: 16, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <Input label="Device name" placeholder="e.g. MacBook Air" />
            <Input label="Internal tag" placeholder="Optional" />
          </div>
        </UsageExample>
      </StorySection>

      <StorySection
        title="Mobile constraints"
        description="The mobile contract needs to be explicit because iOS zoom prevention and disabled-state readability are structural, not decorative."
      >
        <TwoColumn>
          <StoryCard title="Disabled state" caption="Disabled is different from optional. The field stays legible, but interaction is unavailable in the current context.">
            <Input label="Protocol" value="AmneziaWG" disabled description="Protocol is locked for your plan." />
          </StoryCard>
          <StoryCard title="iOS zoom contract" caption="All text inputs must stay at 16px or above to prevent Safari auto-zoom on focus.">
            <div style={{ display: "grid", gap: 12 }}>
              <Input label="Email" type="email" placeholder="you@example.com" />
              <div style={{ color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                iOS auto-zoom prevention contract: never set input font-size below 16px on text, email, password, or textarea controls.
              </div>
            </div>
          </StoryCard>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const Default: Story = {
  args: { placeholder: "Enter value" },
};

export const WithLabel: Story = {
  args: { label: "Email", placeholder: "you@example.com", type: "email" },
};

export const WithError: Story = {
  args: { label: "Username", placeholder: "username", error: "Username is required" },
};

export const Disabled: Story = {
  args: { label: "Protocol", value: "AmneziaWG", disabled: true, description: "Protocol is locked for your plan." },
};

export const FocusedState: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <div style={{ display: "grid", gap: 16, padding: 16, maxWidth: 390 }}>
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        fieldClassName="field--focused-story"
        value="you@example.com"
        onChange={() => {}}
      />
      <Input
        label="Device name"
        placeholder="e.g. MacBook Air"
        fieldClassName="field--focused-story"
        value="MacBook"
        onChange={() => {}}
      />
    </div>
  ),
};

export const IOSZoomTest: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <div style={{ display: "grid", gap: 16, padding: 16, maxWidth: 390 }}>
      <Input label="Email" type="email" placeholder="you@example.com" />
      <Input label="Password" type="password" placeholder="Enter password" />
      <div style={{ color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>
        Verify that all input elements remain at 16px minimum font-size to prevent iOS Safari auto-zoom on focus.
      </div>
    </div>
  ),
};

export const InStack: Story = {
  render: () => (
    <Stack gap="2">
      <Input label="First name" placeholder="e.g. Alex" />
      <Input label="Last name" placeholder="e.g. Morgan" />
    </Stack>
  ),
};
