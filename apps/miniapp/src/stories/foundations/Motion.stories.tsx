import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/design-system";
import { MOTION_TOKENS, MOTION_DURATION_MS } from "@/design-system/core/tokens";
import { expect, userEvent, within } from "storybook/test";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationCodePreview,
} from "./foundationShared";
import "./motionFoundationDemo.css";

const meta: Meta = {
  title: "Foundations/Motion",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Duration and easing tokens for the miniapp motion system. Use `--duration-*` and `--ease-*` so feedback, overlays, and transitions feel consistent.",
      },
    },
  },
};
export default meta;

const motionKeys = Object.keys(MOTION_TOKENS) as Array<keyof typeof MOTION_TOKENS>;

export const Tokens: StoryObj = {
  parameters: {
    docs: {
      description: {
        story: "Duration and easing tokens for dialogs, banners, and small feedback transitions.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Motion tokens</GroupLabel>
        <TokenGrid>
          {motionKeys.map((key) => (
            <TokenSlot
              key={key}
              label={key}
              value={String(MOTION_TOKENS[key])}
            >
              <FoundationCodePreview minHeight={64}>
                {String(MOTION_TOKENS[key])}
              </FoundationCodePreview>
            </TokenSlot>
          ))}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

type DurationKind = keyof typeof MOTION_DURATION_MS;
type EasingKind = "press" | "release" | "enter" | "exit" | "standard";

export const Showcase: StoryObj = {
  name: "Replay motion",
  parameters: {
    docs: {
      description: {
        story: "A deterministic motion demo: click replay to animate the box using motion tokens.",
      },
    },
  },
  render: () => (
    <MotionPlayground durationKind="tap" easingKind="standard" />
  ),
};

export const Playground: StoryObj<{
  durationKind: DurationKind;
  easingKind: EasingKind;
}> = {
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
  parameters: {
    docs: {
      description: {
        story: "Adjust duration and easing to see how transitions feel. Includes a play() test to validate interaction outcomes.",
      },
    },
  },
  render: ({ durationKind, easingKind }) => (
    <MotionPlayground durationKind={durationKind} easingKind={easingKind} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const replayButton = await canvas.findByRole("button", { name: "Replay motion" });

    // Ensure initial counter is 0.
    const counter = await canvas.findByText(/Replays:/);
    expect(counter).toHaveTextContent("Replays: 0");

    await userEvent.click(replayButton);
    await expect(canvas.getByText("Replays: 1")).toBeInTheDocument();
  },
};

function MotionPlayground({
  durationKind,
  easingKind,
}: {
  durationKind: DurationKind;
  easingKind: EasingKind;
}) {
  const [phase, setPhase] = useState(false);
  const [replayCount, setReplayCount] = useState(0);

  useEffect(() => {
    // Start at rest; the user triggers motion via Replay button.
    setPhase(false);
  }, []);

  const replay = () => {
    // Force transform back to 0 before running the next animation frame.
    setPhase(false);
    window.requestAnimationFrame(() => {
      setPhase(true);
    });
    setReplayCount((c) => c + 1);
  };

  return (
    <FoundationSection>
      <GroupLabel>Motion transition</GroupLabel>
      <div className="story-preview-card">
        <div className="story-stack story-stack--tight">
          <Button type="button" onClick={replay}>
            Replay motion
          </Button>
          <div aria-live="polite" className="story-theme-rule-text">
            Replays: {replayCount}
          </div>
          <div
            aria-label="Motion box"
            className="motion-foundation-box"
            data-phase={phase ? "on" : "off"}
            data-duration={durationKind}
            data-easing={easingKind}
          >
            <div className="motion-foundation-inner">
              <span className="story-label">Token-driven</span>
            </div>
          </div>
        </div>
      </div>
    </FoundationSection>
  );
}
