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
    docs: {
      description: {
        component:
          "Standalone switch control. Use ToggleRow for settings-style label + switch. Uses design tokens.",
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
    <StorySection title="Interactive" description="Toggle to change state.">
      <StoryShowcase>
        <SwitchDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="On, off, disabled.">
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
