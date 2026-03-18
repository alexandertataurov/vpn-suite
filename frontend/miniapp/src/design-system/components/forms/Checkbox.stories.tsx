import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/Checkbox",
  tags: ["autodocs"],
  component: Checkbox,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Checkbox form control with label, description, and validation states. Uses design tokens.",
      },
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Accept terms and conditions", checked: false },
  render: (args) => (
    <StoryShowcase>
      <Checkbox {...args} />
    </StoryShowcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <StorySection title="With helper text" description="Use for hints and guidance.">
      <StoryShowcase>
        <Checkbox
          label="Enable notifications"
          description="Receive push notifications for important updates."
          checked={false}
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Default, checked, error, success, disabled.">
      <StoryShowcase>
        <StoryStack>
          <Checkbox label="Default" checked={false} />
          <Checkbox label="Checked" checked />
          <Checkbox label="Error" checked={false} error="This field is required" />
          <Checkbox label="Success" checked success="Saved" />
          <Checkbox label="Disabled" checked={false} disabled />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [checked, setChecked] = useState(false);
    return (
      <StorySection title="Interactive" description="Toggle to change state.">
        <StoryShowcase>
          <Checkbox
            label="I agree to the terms"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </StoryShowcase>
      </StorySection>
    );
  },
};

export const FormContext: Story = {
  render: () => (
    <StorySection title="In form context" description="Multiple checkboxes.">
      <StoryShowcase>
        <StoryStack>
          <Checkbox label="Email notifications" checked />
          <Checkbox label="SMS notifications" checked={false} />
          <Checkbox label="Marketing emails" checked={false} />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
