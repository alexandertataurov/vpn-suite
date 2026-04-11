import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_DURATION_MS, MOTION_TOKENS } from "@/design-system/foundations";
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
  title: "Foundations/Motion",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};
export default meta;

const MOTION_ENTRIES = Object.entries(MOTION_TOKENS) as Array<[keyof typeof MOTION_TOKENS, string]>;

type DurationKind = keyof typeof MOTION_DURATION_MS;
type EasingKind = "press" | "release" | "enter" | "exit" | "standard";

const EASING_TO_TOKEN: Record<EasingKind, string> = {
  press: "--ease-press",
  release: "--ease-release",
  enter: "--ease-enter",
  exit: "--ease-exit",
  standard: "--ease-standard",
};

export const Tokens: StoryObj = {
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Motion Tokens"
        description="Duration and easing tokens define a predictable interaction tempo."
      />
      <FoundationGroup>
        <GroupLabel>Motion inventory</GroupLabel>
        <TokenGrid>
          {MOTION_ENTRIES.map(([key, token]) => (
            <TokenSlot key={key} label={String(key)} value={token}>
              <FoundationCodePreview minHeight={64}>{token}</FoundationCodePreview>
            </TokenSlot>
          ))}
        </TokenGrid>
      </FoundationGroup>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Motion showcase",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Applied Motion"
        description="Motion supports orientation, not decoration. Duration choices match interaction consequence."
      />
      <FoundationPanel style={{ maxWidth: "36rem" }}>
        <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
          <p style={{ margin: 0 }}>Tap feedback: {MOTION_DURATION_MS.tap}ms</p>
          <p style={{ margin: 0 }}>Panel transition: {MOTION_DURATION_MS.panel}ms</p>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Keep short transitions for immediate feedback and reserve longer timings for spatial changes.
          </p>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const MotionRules: StoryObj = {
  name: "Applied motion rules",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Motion Rules"
        description="Use motion to confirm state change and preserve comprehension with reduced-motion settings."
      />
      <FoundationGrid>
        <FoundationPanel>
          <GroupLabel>Purpose</GroupLabel>
          <p style={{ margin: 0 }}>Animation should clarify transitions, not delay the user from acting.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Accessibility</GroupLabel>
          <p style={{ margin: 0 }}>The interface must stay clear when motion is reduced or fully removed.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Consistency</GroupLabel>
          <p style={{ margin: 0 }}>Match CSS and JS timing with token-based durations only.</p>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ durationKind: DurationKind; easingKind: EasingKind }> = {
  name: "Interactive · motion tokens",
  argTypes: {
    durationKind: {
      control: "select",
      options: Object.keys(MOTION_DURATION_MS) as DurationKind[],
    },
    easingKind: {
      control: "select",
      options: ["press", "release", "enter", "exit", "standard"],
    },
  },
  args: { durationKind: "tap", easingKind: "standard" },
  render: ({ durationKind, easingKind }) => {
    const durationMs = MOTION_DURATION_MS[durationKind];
    const easingToken = EASING_TO_TOKEN[easingKind];

    return (
      <FoundationSection>
        <FoundationIntro
          title="Motion Playground"
          description="Stateless token preview for duration and easing pair selection."
        />
        <FoundationPanel>
          <p style={{ margin: 0 }}>
            Duration: <code>--duration-{durationKind}</code> ({durationMs}ms)
          </p>
          <p style={{ margin: 0 }}>
            Easing: <code>{easingToken}</code>
          </p>
          <div
            style={{
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-surface)",
              background: "var(--color-surface-2)",
              padding: "var(--spacing-3)",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "min(12rem, 100%)",
                borderRadius: "var(--radius-button)",
                background: "var(--color-accent)",
                color: "var(--color-on-accent)",
                padding: "10px 12px",
                transitionProperty: "transform",
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: `var(${easingToken})`,
              }}
            >
              Token-driven transition sample
            </div>
          </div>
        </FoundationPanel>
      </FoundationSection>
    );
  },
};
