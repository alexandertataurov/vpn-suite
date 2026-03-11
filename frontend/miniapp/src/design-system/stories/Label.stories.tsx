import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HelperText } from "../components/forms/HelperText";
import { Input } from "../components/forms/Input";
import { Label } from "../components/forms/Label";
import { Select } from "../components/forms/Select";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "./foundations.story-helpers";

const SERVER_OPTIONS = [
  { value: "auto", label: "Fastest available" },
  { value: "nl", label: "Amsterdam, NL" },
  { value: "de", label: "Frankfurt, DE" },
];

const meta = {
  title: "Primitives/Label",
  tags: ["autodocs"],
  component: Label,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
    docs: {
      description: {
        component:
          "Label is the semantic field title for mobile forms. It owns required-marker rendering, label state colors, and the tap-to-focus contract when used as a real `<label htmlFor>`.",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <LabelShowcaseDemo />,
};

export const Default: Story = {
  render: () => (
    <div className="label-story-frame">
      <Label htmlFor="label-device-name">Device name</Label>
      <input id="label-device-name" className="input" defaultValue="MacBook Air" aria-label="Device name" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="label-story-frame">
      <Label htmlFor="label-server-preset" required>
        Server preset
      </Label>
      <input id="label-server-preset" className="input" defaultValue="Fastest available" aria-label="Server preset" />
    </div>
  ),
};

export const AllStates: Story = {
  parameters: { chromatic: { viewports: [390] } },
  render: () => (
    <div className="label-story-frame label-story-stack">
      <LabelStateExample id="label-state-idle" state="idle" value="MacBook Air" helper="Idle label uses the default contrast token." />
      <LabelStateExample id="label-state-focused" state="focused" value="MacBook Air" helper="Focused label uses the accent color to match the active field." focused />
      <LabelStateExample id="label-state-error" state="error" value="@@invalid" helper="Only letters allowed." />
      <LabelStateExample id="label-state-success" state="success" value="MacBook Air" helper="Saved to your profile." />
      <LabelStateExample id="label-state-disabled" state="disabled" value="WireGuard" helper="Disabled labels dim with their control." disabled />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { chromatic: { viewports: [390] } },
  render: () => (
    <div className="label-story-dark-frame">
      <Stack gap="3">
        <Label htmlFor="dark-device-name">Device name</Label>
        <input id="dark-device-name" className="input" defaultValue="MacBook Air" aria-label="Device name" />
        <Label htmlFor="dark-server-preset" required>
          Server preset
        </Label>
        <input id="dark-server-preset" className="input" defaultValue="Fastest available" aria-label="Server preset" />
        <Label state="error">Email</Label>
        <Label state="disabled">Protocol</Label>
      </Stack>
    </div>
  ),
};

function LabelShowcaseDemo() {
  const [server, setServer] = useState("auto");

  return (
    <StoryPage
      eyebrow="Components"
      title="Label"
      summary="Label should be documented in field context, not as floating uppercase text. The mobile contract is 12px uppercase with stronger contrast, visible required markers, explicit state colors, and real tap-to-focus semantics."
      stats={[
        { label: "Mobile size", value: "12px" },
        { label: "States", value: "5" },
        { label: "Tap to focus", value: "required" },
      ]}
    >
      <StorySection
        title="Field context"
        description="Labels are only meaningful when shown with their associated control. Use `<label htmlFor>` for tap-to-focus, keep required markers on the label itself, and preserve the same styling when semantics change."
      >
        <ThreeColumn>
          <StoryCard title="Default field" caption="Standard label plus input pair. Tapping the label should focus the input on mobile.">
            <Input label="Device name" id="device-name-story" placeholder="MacBook Air" defaultValue="MacBook Air" />
          </StoryCard>
          <StoryCard title="Required field" caption="Required markers stay amber and belong on the field label, not the section title.">
            <Select
              id="server-preset-story"
              label="Server preset"
              required
              value={server}
              onChange={setServer}
              options={SERVER_OPTIONS}
            />
          </StoryCard>
          <StoryCard title="Polymorphic semantics" caption="`as` changes HTML semantics only. The visual output stays stable while the context changes.">
            <div className="label-story-stack">
              <div className="label-story-inline-row">
                <Label as="span">Status</Label>
                <span className="label-story-status-chip">Active</span>
              </div>
              <fieldset className="label-story-fieldset">
                <Label as="legend" required>
                  Section label
                </Label>
                <input className="input" defaultValue="Field 1" aria-label="Field 1" />
                <input className="input" defaultValue="Field 2" aria-label="Field 2" />
              </fieldset>
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="States and anatomy"
        description="Labels track the control state. Focus, validation, success, and disabled states should be visible at the label level, and the spacing contract should be shown with helper text in place."
      >
        <TwoColumn>
          <UsageExample title="All states" description="State color belongs to the label primitive so field-level docs do not have to reinvent it.">
            <div className="label-story-frame label-story-stack">
              <LabelStateExample id="label-usage-idle" state="idle" value="MacBook Air" helper="Idle label uses the default contrast token." />
              <LabelStateExample id="label-usage-focused" state="focused" value="MacBook Air" helper="Focused state follows the active field." focused />
              <LabelStateExample id="label-usage-error" state="error" value="@@invalid" helper="Only letters allowed." />
              <LabelStateExample id="label-usage-success" state="success" value="MacBook Air" helper="Saved to your profile." />
              <LabelStateExample id="label-usage-disabled" state="disabled" value="WireGuard" helper="Disabled labels dim with their control." disabled />
            </div>
          </UsageExample>
          <UsageExample title="Field anatomy" description="The default trio is Label, control, then helper text. Document the spacing in that order, not as detached text samples.">
            <div className="label-story-frame">
              <Label htmlFor="label-anatomy-device">Device name</Label>
              <input id="label-anatomy-device" className="input" defaultValue="MacBook Air" aria-label="Device name" />
              <HelperText>Shown in your device list.</HelperText>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Accessibility contract"
        description="Tap-to-focus is required for mobile forms. A real label must use `htmlFor`, while `span` and `legend` variants are semantic exceptions and do not own focus behavior."
      >
        <TwoColumn>
          <UsageExample title="Tap to focus" description="A label rendered as `<label htmlFor>` should focus its input and open the keyboard on mobile when tapped.">
            <div className="label-story-frame">
              <Label htmlFor="label-tap-focus">Device name</Label>
              <input id="label-tap-focus" className="input" placeholder="Tap the label above in Storybook interactions" aria-label="Device name" />
            </div>
          </UsageExample>
          <UsageExample title="Dark theme" description="Dark-theme snapshots validate that label contrast and state colors still read correctly on the runtime surface.">
            <div className="label-story-dark-frame">
              <Stack gap="3">
                <Label>Device name</Label>
                <Label required>Server preset</Label>
                <Label state="error">Email</Label>
                <Label state="disabled">Protocol</Label>
              </Stack>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  );
}

function LabelStateExample({
  id,
  state,
  value,
  helper,
  focused = false,
  disabled = false,
}: {
  id: string;
  state: "idle" | "focused" | "error" | "success" | "disabled";
  value: string;
  helper: string;
  focused?: boolean;
  disabled?: boolean;
}) {
  const helperTone =
    state === "error" ? "error" : state === "success" ? "success" : "hint";

  return (
    <div>
      <Label htmlFor={id} state={state}>
        Device name
      </Label>
      <input
        id={id}
        defaultValue={value}
        aria-label="Device name"
        disabled={disabled}
        className={focused ? "input label-story-input-focused" : "input"}
      />
      <HelperText variant={helperTone}>{helper}</HelperText>
    </div>
  );
}
