import type { Meta, StoryObj } from "@storybook/react";
import {
  FoundationGrid,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
} from "../shared/foundationShared";

const meta: Meta = {
  title: "Foundations/Accessibility",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};

export default meta;

export const FocusAndTargets: StoryObj = {
  name: "Focus and target sizing",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Focus And Touch Targets"
        description="Keyboard visibility and touch comfort are baseline requirements, not optional polish."
      />
      <FoundationPanel style={{ maxWidth: "32rem" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>Email</span>
          <input
            type="email"
            aria-label="Email"
            placeholder="you@example.com"
            style={{
              minHeight: 48,
              borderRadius: "var(--radius-control)",
              border: "1px solid var(--color-border)",
              padding: "0 12px",
              background: "var(--color-surface)",
            }}
          />
        </label>
        <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              minHeight: 48,
              borderRadius: "var(--radius-button)",
              border: 0,
              padding: "0 14px",
              background: "var(--color-accent)",
              color: "var(--color-on-accent)",
            }}
          >
            Continue
          </button>
          <button
            type="button"
            style={{
              minHeight: 48,
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--color-border)",
              padding: "0 14px",
              background: "var(--color-surface)",
            }}
          >
            View plans
          </button>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const FeedbackRedundancy: StoryObj = {
  name: "Non-color feedback",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Redundant Feedback Signals"
        description="Status should stay understandable through text and structure even without color cues."
      />
      <FoundationGrid>
        <FoundationPanel>
          <GroupLabel>Connected</GroupLabel>
          <p style={{ margin: 0 }}>Status uses text label plus success color.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Action required</GroupLabel>
          <p style={{ margin: 0 }}>Warning copy states what needs attention and when.</p>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const MotionSafety: StoryObj = {
  name: "Motion safety checklist",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Motion Safety"
        description="Critical outcomes must remain explicit when animations are reduced or removed."
      />
      <FoundationGrid>
        <FoundationPanel>
          <GroupLabel>Do</GroupLabel>
          <p style={{ margin: 0 }}>Pair transitions with plain text confirmation of the new state.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Do not</GroupLabel>
          <p style={{ margin: 0 }}>Rely on animation alone to communicate success, failure, or navigation changes.</p>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};
