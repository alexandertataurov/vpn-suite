import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";
import { StorySection, StoryShowcase } from "@/design-system";
import { Inline } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Switch",
  tags: ["autodocs"],
  component: Switch,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Standalone switch control for boolean settings. Use `ToggleRow` when you need a settings-style label plus control row.",
      },
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

function SwitchDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <Switch checked={checked} onCheckedChange={setChecked} aria-label="Toggle" />
  );
}

export const Default: Story = {
  render: () => (
    <StorySection title="Interactive" description="Basic uncontrolled interaction with a label-only control.">
      <StoryShowcase>
        <SwitchDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Off, on, and disabled states shown together for comparison.">
      <StoryShowcase>
        <div className="story-stack">
          <Inline gap="2" wrap align="center">
            <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
            <span className="story-label">Off</span>
          </Inline>
          <Inline gap="2" wrap align="center">
            <Switch checked onCheckedChange={() => {}} aria-label="On" />
            <span className="story-label">On</span>
          </Inline>
          <Inline gap="2" wrap align="center">
            <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Disabled" />
            <span className="story-label">Disabled</span>
          </Inline>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};
