import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HelperText, Input, Label } from "../components";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Primitives/HelperText",
  tags: ["autodocs"],
  component: HelperText,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
    docs: {
      description: {
        component:
          "HelperText is the support-message layer for mobile forms. It should always be shown with its field, with hint replaced by error or success when validation state changes.",
      },
    },
  },
} satisfies Meta<typeof HelperText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <HelperTextShowcaseDemo />,
};

export const Hint: Story = {
  render: () => (
    <div className="helper-story-field">
      <Label htmlFor="helper-hint-field">Device name</Label>
      <input id="helper-hint-field" className="input" defaultValue="MacBook Air" aria-label="Device name" />
      <HelperText>Use a name you can recognize later.</HelperText>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="helper-story-field">
      <Label htmlFor="helper-error-field" state="error">
        Device name
      </Label>
      <input id="helper-error-field" className="input input-error" aria-label="Device name" aria-invalid />
      <HelperText variant="error">This field is required.</HelperText>
    </div>
  ),
};

export const Success: Story = {
  render: () => (
    <div className="helper-story-field">
      <Label htmlFor="helper-success-field" state="success">
        Username
      </Label>
      <input id="helper-success-field" className="input input-success" defaultValue="my-device" aria-label="Username" />
      <HelperText variant="success" showIcon>
        Saved to your profile.
      </HelperText>
    </div>
  ),
};

export const Count: Story = {
  render: () => (
    <div className="helper-story-frame">
      <CountField id="helper-count-neutral" value="my-device" current={9} max={32} />
      <CountField id="helper-count-warning" value="priority-route-device-tag-01" current={28} max={32} />
      <CountField id="helper-count-limit" value="business-annual-seat-label-0001" current={32} max={32} />
    </div>
  ),
};

export const MobileInContext: Story = {
  parameters: { chromatic: { viewports: [390, 375] } },
  render: () => (
    <div className="helper-story-frame">
      <div className="helper-story-field">
        <Label htmlFor="helper-mobile-device">Device name</Label>
        <input id="helper-mobile-device" className="input" defaultValue="MacBook Air" aria-label="Device name" />
        <HelperText>Use a name you can recognize later.</HelperText>
      </div>
      <div className="helper-story-field">
        <Label htmlFor="helper-mobile-email" state="error">
          Email
        </Label>
        <input id="helper-mobile-email" className="input input-error" aria-label="Email" aria-invalid />
        <HelperText variant="error">This field is required.</HelperText>
      </div>
      <div className="helper-story-field">
        <Label htmlFor="helper-mobile-username" state="success">
          Username
        </Label>
        <input id="helper-mobile-username" className="input input-success" defaultValue="my-device" aria-label="Username" />
        <HelperText variant="success" showIcon>
          Saved to your profile.
        </HelperText>
      </div>
      <CountField id="helper-mobile-tag" label="Internal tag" value="my-device" current={9} max={32} />
    </div>
  ),
};

function HelperTextShowcaseDemo() {
  const [tag, setTag] = useState("my-device");

  return (
    <StoryPage
      eyebrow="Components"
      title="HelperText"
      summary="HelperText belongs to the field, not the card. The mobile contract is one visible support message per state, with hint replaced by error or success, optional status icons, count support, and clear live-region semantics."
      stats={[
        { label: "Variants", value: "4" },
        { label: "Icons", value: "optional" },
        { label: "Mobile width", value: "390px" },
      ]}
    >
      <StorySection
        title="Field context"
        description="Every helper message should be attached to the field that owns it. Hint, error, and success share placement, but only one of them should be visible at a time."
      >
        <ThreeColumn>
          <StoryCard title="Hint state" caption="Idle and focused fields show hint text only. The hint should stay readable without competing with the field label.">
            <Input
              label="Device name"
              id="helper-showcase-device"
              defaultValue="MacBook Air"
              description="Use a name you can recognize later."
            />
          </StoryCard>
          <StoryCard title="Error state" caption="Error replaces the hint and is announced immediately through the default alert contract.">
            <Input
              label="Device name"
              id="helper-showcase-error"
              value=""
              onChange={() => {}}
              error="This field is required."
            />
          </StoryCard>
          <StoryCard title="Success state" caption="Success replaces the hint after validation or save confirmation.">
            <div className="helper-story-field">
              <Label htmlFor="helper-showcase-success" state="success">
                Username
              </Label>
              <input
                id="helper-showcase-success"
                className="input input-success"
                defaultValue="my-device"
                aria-label="Username"
              />
              <HelperText variant="success" showIcon>
                Saved to your profile.
              </HelperText>
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Replacement and count"
        description="Hint and error should not stack on the same field. Show the transition as a before-and-after replacement, then document the separate count pattern for constrained inputs."
      >
        <TwoColumn>
          <UsageExample title="Replacement rule" description="Before validation, the hint is visible. After validation fails, the error replaces it. No simultaneous hint-plus-error pattern.">
            <div className="helper-story-replacement">
              <div className="helper-story-field">
                <Label htmlFor="helper-before-validation">Device name</Label>
                <input id="helper-before-validation" className="input" defaultValue="MacBook Air" aria-label="Device name" />
                <HelperText>Use a name you can recognize later.</HelperText>
              </div>
              <div className="helper-story-field">
                <Label htmlFor="helper-after-validation" state="error">
                  Device name
                </Label>
                <input id="helper-after-validation" className="input input-error" aria-label="Device name" aria-invalid />
                <HelperText variant="error">This field is required.</HelperText>
              </div>
            </div>
          </UsageExample>
          <UsageExample title="Character count" description="Count is a separate helper variant for constrained fields. It uses mono digits and escalates near the limit.">
            <div className="helper-story-frame">
              <CountField id="helper-count-example" value={tag} current={tag.length} max={32} onChange={setTag} />
              <CountField id="helper-count-warning-example" value="priority-route-device-tag-01" current={28} max={32} />
              <CountField id="helper-count-limit-example" value="business-annual-seat-label-0001" current={32} max={32} />
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Accessibility and motion"
        description="Live-region semantics should match the severity of the message, and the appearance/disappearance of helper text should feel deliberate without height animation."
      >
        <TwoColumn>
          <UsageExample title="Live-region contract" description="Errors interrupt immediately. Hint, success, and count remain polite. Count announcements should be throttled by the calling field logic rather than fired every keystroke.">
            <div className="helper-story-contract">
              <div className="helper-story-contract-row">
                <strong>Hint</strong>
                <span><code>role</code> none, <code>aria-live=&quot;polite&quot;</code></span>
              </div>
              <div className="helper-story-contract-row">
                <strong>Error</strong>
                <span><code>role=&quot;alert&quot;</code>, <code>aria-live=&quot;assertive&quot;</code></span>
              </div>
              <div className="helper-story-contract-row">
                <strong>Success</strong>
                <span><code>role</code> none, <code>aria-live=&quot;polite&quot;</code></span>
              </div>
              <div className="helper-story-contract-row">
                <strong>Count</strong>
                <span><code>role</code> none, <code>aria-live=&quot;polite&quot;</code>; announce only at meaningful thresholds such as 75%, 90%, and 100%.</span>
              </div>
            </div>
          </UsageExample>
          <UsageExample title="Animation contract" description="Helper text enters with a 150ms fade-and-lift and exits with a 100ms fade. Avoid animating height.">
            <div className="helper-story-field">
              <Label htmlFor="helper-motion-contract">Device name</Label>
              <input id="helper-motion-contract" className="input" defaultValue="MacBook Air" aria-label="Device name" />
              <HelperText>Hint fades in with `helperEnter`.</HelperText>
              <HelperText variant="error" className="exiting">
                Error fades out with `helperExit`.
              </HelperText>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  );
}

function CountField({
  id,
  label = "Internal tag",
  value,
  current,
  max,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  current: number;
  max: number;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="helper-story-field">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        readOnly={!onChange}
        maxLength={max}
        aria-label={label}
      />
      <HelperText variant="count" current={current} max={max} />
    </div>
  );
}
