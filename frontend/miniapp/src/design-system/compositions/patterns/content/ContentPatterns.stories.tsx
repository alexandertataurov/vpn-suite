import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import {
  ButtonRow,
  ButtonRowAuto,
  CardFooterLink,
  FormField,
  SegmentedControl,
  SettingsCard,
  SettingsDivider,
  ToggleRow,
} from "@/design-system/compositions/patterns";
import { Button } from "@/design-system/components";
import { IconHelpCircle, IconRotateCw } from "@/design-system/icons";
import {
  StoryCard,
  StoryPage,
  StorySection,
  TwoColumn,
  UsageExample,
} from "@/design-system/utils/story-helpers";

const meta = {
  title: "Patterns/Form Controls",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Content patterns package common content-library structures for forms, dense settings surfaces, segmented choices, and bottom-of-card CTA layouts. Miniapp pages should compose these patterns (plus layouts) directly instead of inventing bespoke cards, list rows, or page-specific CSS.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ContentStoryFrame({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: "var(--spacing-4)", maxWidth: 640 }}>{children}</div>;
}

function MobileContentStoryFrame({ children, keyboardCrop = false }: { children: ReactNode; keyboardCrop?: boolean }) {
  return (
    <div
      style={{
        width: 390,
        maxWidth: "100%",
        height: keyboardCrop ? 400 : "auto",
        overflow: keyboardCrop ? "hidden" : "visible",
      }}
    >
      <ContentStoryFrame>{children}</ContentStoryFrame>
    </div>
  );
}

function ValidationStatesExample() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField
        label="Device name"
        state="idle"
        helperText="Shown in your device list."
        input={<input aria-label="Device name idle" className="input field-input" value="" readOnly placeholder="MacBook Air" />}
      />
      <FormField
        label="Device name"
        state="focused"
        input={<input aria-label="Device name focused" className="input field-input" value="MacBook" readOnly />}
      />
      <FormField
        label="Device name"
        state="required_unfilled"
        input={<input aria-label="Device name required" className="input field-input" value="" readOnly placeholder="Required to continue" />}
      />
      <FormField
        label="Device name"
        state="error"
        errorMessage="Only letters and numbers allowed."
        input={<input aria-label="Device name invalid" className="input field-input" value="@@invalid" readOnly />}
      />
      <FormField
        label="Device name"
        state="success"
        successMessage="Saved to this profile."
        input={<input aria-label="Device name saved" className="input field-input" value="MacBook Air" readOnly />}
      />
      <FormField
        label="Device name"
        state="disabled"
        input={<input aria-label="Device name disabled" className="input field-input" value="MacBook Air" readOnly disabled />}
      />
    </div>
  );
}

function ValidationFeedbackExample() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField
        label="Device name"
        state="error"
        errorMessage="Only letters and numbers allowed."
        input={<input aria-label="Device name error feedback" className="input field-input" value="@@invalid" readOnly />}
      />
      <FormField
        label="Device name"
        state="success"
        successMessage="Saved to this profile."
        input={<input aria-label="Device name success feedback" className="input field-input" value="MacBook Air" readOnly />}
      />
      <FormField
        label="Device name"
        state="disabled"
        helperText="Disabled fields communicate unavailable input, not readonly review."
        input={<input aria-label="Device name disabled feedback" className="input field-input" value="MacBook Air" readOnly disabled />}
      />
    </div>
  );
}

function ActionSlotExample() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField
        label="DNS"
        state="readonly"
        helperText="Readonly display fields may expose inline actions."
        action={<button className="content-action-link content-action-link--default">Edit</button>}
        input={<input aria-label="DNS value" className="input field-input" value="1.1.1.1" readOnly />}
      />
      <FormField
        label="Access key"
        state="readonly"
        action={
          <button
            className="content-action-link content-action-link--warning content-action-link--icon"
            aria-label="Regenerate access key"
            title="Regenerate"
          >
            <IconRotateCw size={14} strokeWidth={1.8} />
          </button>
        }
        input={<input aria-label="Access key value" className="input field-input" value="awg_live_profile_key" readOnly />}
      />
      <FormField
        label="Protocol"
        state="loading"
        helperText="Loading should read as system resolution, not as static field content."
        input={
          <div className="field-input field-input--loading" aria-live="polite">
            <span className="content-loading-dot" aria-hidden />
            <span>Loading…</span>
          </div>
        }
      />
      <FormField
        label="Recovery token"
        state="disabled"
        helperText="Disabled action-slot fields hide actions instead of presenting unavailable links."
        input={<input aria-label="Recovery token unavailable" className="input field-input" value="Token unavailable" readOnly disabled />}
      />
    </div>
  );
}

function FullSettingsStackExample() {
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [splitTunnel, setSplitTunnel] = useState(false);

  return (
    <SettingsCard>
      <FormField
        label="Protocol"
        state="readonly"
        helperText="Single supported protocol should render as readonly, not as a dropdown."
        input={<input aria-label="Protocol value" className="input field-input" value="AmneziaWG" readOnly />}
      />
      <ToggleRow
        name="Auto reconnect"
        description="Reconnect tunnel when connectivity is restored."
        checked={autoReconnect}
        onChange={setAutoReconnect}
      />
      <ToggleRow
        name="Kill switch"
        description="Block traffic when the secure tunnel is unavailable."
        checked={false}
        onChange={() => undefined}
        disabled={!autoReconnect}
        disabledReason="Requires Auto reconnect to be enabled."
      />
      <ToggleRow
        name="Split tunneling"
        description="Exclude selected apps from the VPN route."
        checked={splitTunnel}
        onChange={setSplitTunnel}
      />
      <FormField
        label="DNS"
        state="readonly"
        action={<Button variant="link" size="sm">Edit</Button>}
        input={<input aria-label="DNS readonly value" className="input field-input" value="1.1.1.1" readOnly />}
      />
      <FormField
        label="MTU"
        state="readonly"
        action={<Button variant="link" size="sm">Edit</Button>}
        input={<input aria-label="MTU readonly value" className="input field-input" value="1420" readOnly />}
      />
    </SettingsCard>
  );
}

function ControlledSegmentedExample() {
  const [billing, setBilling] = useState("monthly");

  return (
    <SegmentedControl
      ariaLabel="Billing cadence"
      value={billing}
      onChange={setBilling}
      options={[
        { id: "monthly", label: "MONTHLY" },
        {
          id: "lifetime",
          label: "LIFETIME",
          badge: { label: "NEW", variant: "new" },
        },
      ]}
    />
  );
}

function ControlledSegmentedDebugExample() {
  const [billing, setBilling] = useState("monthly");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SegmentedControl
        ariaLabel="Billing cadence"
        value={billing}
        onChange={setBilling}
        options={[
          { id: "monthly", label: "MONTHLY" },
          {
            id: "lifetime",
            label: "LIFETIME",
            badge: { label: "NEW", variant: "new" },
          },
        ]}
      />
      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Selected: {billing}</div>
    </div>
  );
}

function TouchFeedbackExample() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField
        label="Device name"
        state="idle"
        className="field-group--pressed"
        helperText="Tap feedback should register immediately before the keyboard animation starts."
        input={<input aria-label="Pressed device name" className="input field-input" value="MacBook" readOnly />}
      />
      <FormField
        label="DNS"
        state="readonly"
        action={<button className="content-action-link content-action-link--default content-action-link--pressed">Edit</button>}
        input={<input aria-label="Pressed DNS value" className="input field-input" value="1.1.1.1" readOnly />}
      />
      <SegmentedControl
        ariaLabel="Billing cadence press state"
        className="seg-toggle--pressed"
        value="lifetime"
        options={[
          { id: "monthly", label: "MONTHLY" },
          { id: "lifetime", label: "LIFETIME" },
        ]}
      />
    </div>
  );
}

function FooterLinkExamples() {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
      <CardFooterLink onClick={() => undefined}>See all available plans</CardFooterLink>
      <CardFooterLink variant="muted" onClick={() => undefined}>Manage setup logs</CardFooterLink>
      <CardFooterLink variant="destructive" onClick={() => undefined}>Delete account</CardFooterLink>
    </div>
  );
}

function ManualDividerExample() {
  return (
    <SettingsCard divider={false}>
      <FormField
        label="Access key"
        state="readonly"
        helperText="Manual divider placement is useful when a row group needs custom separation."
        input={<input aria-label="Access key readonly" className="input field-input" value="awg_live_profile_key" readOnly />}
      />
      <SettingsDivider />
      <ToggleRow
        name="Emergency access"
        description="Allow limited fallback connectivity during recovery."
        checked
        onChange={() => undefined}
      />
      <SettingsDivider />
      <FormField
        label="Recovery email"
        state="idle"
        helperText="The divider stays available as an explicit grouping primitive."
        input={<input aria-label="Recovery email" className="input field-input" value="" readOnly placeholder="name@example.com" />}
      />
    </SettingsCard>
  );
}

export const Default: Story = {
  tags: ["chromatic"],
  parameters: {
    chromatic: { viewports: [390, 1200] },
  },
  render: () => (
    <StoryPage
      eyebrow="Patterns"
      title="Content patterns"
      summary="These patterns encode recurring content-library structures: validated form rows, dense settings stacks, segmented switches, and canonical CTA hierarchies. The stories now document the missing state contracts instead of only ideal-state examples."
      stats={[
        { label: "Pattern groups", value: "7" },
        { label: "Validation states", value: "6" },
        { label: "Interactive", value: "toggle + segmented" },
      ]}
    >
      <StorySection
        title="Forms and settings"
        description="FormField, SettingsCard, ToggleRow, and SegmentedControl are the standard building blocks for dense settings surfaces. Required, error, success, readonly, and dependency states should be handled here rather than improvised in page code."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--spacing-4)",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
            <StoryCard title="Validation states" caption="Idle and required now keep a visible border, with border color acting as the primary state signal.">
              <ValidationStatesExample />
            </StoryCard>
            <StoryCard title="Validation feedback" caption="Error, success, and disabled keep helper-text rhythm and avoid changing text size between states.">
              <ValidationFeedbackExample />
            </StoryCard>
          </div>
          <StoryCard title="Action slots" caption="Action slots are right-aligned inside readonly/loading fields, not below them. Severity should match consequence: edit is neutral, regenerate is cautionary.">
            <ActionSlotExample />
          </StoryCard>
          <StoryCard title="Segmented control" caption="Badges are explicit option data, selected and unselected badges use distinct contrast, and disabled options expose a reason.">
            <ControlledSegmentedExample />
          </StoryCard>
        </div>
      </StorySection>

      <StorySection
        title="Real settings density"
        description="SettingsCard auto-inserts dividers between rows so dense stacks keep rhythm without each caller manually remembering where separators belong."
      >
        <UsageExample
          title="Full settings stack"
          description="Protocol is readonly while only one option exists, disabled toggles explain their dependency, and divider rhythm is visible at realistic density."
        >
          <FullSettingsStackExample />
        </UsageExample>
      </StorySection>

      <StorySection
        title="Divider control"
        description="SettingsCard usually inserts dividers automatically, but SettingsDivider remains available when a page needs explicit row grouping."
      >
        <UsageExample title="Manual divider placement" description="Disable automatic dividers only when a page needs intentional grouping boundaries.">
          <ManualDividerExample />
        </UsageExample>
      </StorySection>

      <StorySection
        title="Action hierarchy"
        description="ButtonRow should be reserved for truly equal-emphasis decisions. Upgrade flows and hero CTAs should use ButtonRowAuto, where the primary action dominates and the secondary action stays smaller or lighter."
      >
        <TwoColumn>
          <UsageExample title="Equal emphasis" description="Use ButtonRow for balanced confirmation choices where both options deserve equal weight.">
            <ButtonRow>
              <Button variant="danger">Delete</Button>
              <Button variant="secondary">Cancel</Button>
            </ButtonRow>
          </UsageExample>
          <UsageExample title="Primary + deferral" description="Use ButtonRowAuto for upgrade/connect flows so the primary fills the row and the secondary stays lightweight.">
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              <ButtonRowAuto>
                <Button variant="primary" fullWidth>
                  Upgrade
                </Button>
                <Button variant="ghost">Not now</Button>
              </ButtonRowAuto>
              <ButtonRowAuto>
                <Button variant="primary" fullWidth>
                  Connect
                </Button>
                <Button variant="ghost" aria-label="Setup help">
                  <IconHelpCircle size={16} strokeWidth={1.8} />
                </Button>
              </ButtonRowAuto>
              <FooterLinkExamples />
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const MobileShowcase: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <MobileContentStoryFrame>
      <StoryCard title="Validation states" caption="Field height stays fixed at 52px across idle, focus, required, error, and success on a 390px viewport.">
        <ValidationStatesExample />
      </StoryCard>
      <StoryCard title="Action slots" caption="Readonly and loading fields now fit realistic mobile width without truncating the primary value too early.">
        <ActionSlotExample />
      </StoryCard>
      <StoryCard title="Segmented control" caption="The control is shown at mobile width so track contrast and full-width tap targets are visible in context.">
        <ControlledSegmentedExample />
      </StoryCard>
    </MobileContentStoryFrame>
  ),
};

export const FormPatterns: Story = {
  tags: ["chromatic"],
  render: () => (
    <ContentStoryFrame>
      <ValidationStatesExample />
      <ValidationFeedbackExample />
      <ActionSlotExample />
    </ContentStoryFrame>
  ),
};

export const ValidationStates: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <ContentStoryFrame>
      <ValidationStatesExample />
    </ContentStoryFrame>
  ),
};

export const KeyboardOpen: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <MobileContentStoryFrame keyboardCrop>
      <div style={{ display: "grid", gap: 16, paddingBottom: 180 }}>
        <FormField
          label="Recovery email"
          state="idle"
          helperText="This field sits above the keyboard fold."
          input={<input aria-label="Recovery email" className="input field-input" value="owner@vpn.example" readOnly />}
        />
        <FormField
          label="Device name"
          state="focused"
          helperText="Helper text remains visible when the viewport is cropped to keyboard-open height."
          input={<input aria-label="Keyboard open device name" className="input field-input" value="MacBook" readOnly />}
        />
      </div>
    </MobileContentStoryFrame>
  ),
};

export const SegmentedControlStates: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <ContentStoryFrame>
      <ControlledSegmentedDebugExample />
    </ContentStoryFrame>
  ),
};

export const TouchFeedbackStates: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <ContentStoryFrame>
      <TouchFeedbackExample />
    </ContentStoryFrame>
  ),
};

export const FullSettingsStack: Story = {
  parameters: {
    chromatic: { viewports: [390, 768] },
  },
  render: () => (
    <ContentStoryFrame>
      <FullSettingsStackExample />
    </ContentStoryFrame>
  ),
};

export const SettingsDividerControl: Story = {
  render: () => (
    <ContentStoryFrame>
      <ManualDividerExample />
    </ContentStoryFrame>
  ),
};

export const ActionLayouts: Story = {
  render: () => (
    <ContentStoryFrame>
      <ButtonRow>
        <Button variant="danger">Delete</Button>
        <Button variant="secondary">Cancel</Button>
      </ButtonRow>
      <ButtonRowAuto>
        <Button variant="primary" fullWidth>
          Upgrade
        </Button>
        <Button variant="ghost">Not now</Button>
      </ButtonRowAuto>
      <ButtonRowAuto>
        <Button variant="primary" fullWidth>
          Connect
        </Button>
        <Button variant="ghost" aria-label="Setup help">
          <IconHelpCircle size={16} strokeWidth={1.8} />
        </Button>
      </ButtonRowAuto>
      <FooterLinkExamples />
    </ContentStoryFrame>
  ),
};
