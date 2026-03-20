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
          "Checkbox form control with label, description, and validation states. Use it for binary choices that need explicit consent or opt-in wording.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Single checkbox with a clear consent label. This is the default contract for opt-in fields.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <Checkbox {...args} />
    </StoryShowcase>
  ),
};

export const WithDescription: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Checkbox paired with helper text to explain the impact before the user toggles it.",
      },
    },
  },
  render: () => (
    <StorySection title="With helper text" description="Use helper text to explain the choice.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Default, checked, error, success, and disabled states displayed together for quick review.",
      },
    },
  },
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
      <StorySection title="Interactive" description="Toggle the checkbox to confirm controlled state updates.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Checkboxes stacked in a realistic preferences form. Use this to verify spacing and label rhythm.",
      },
    },
  },
  render: () => (
    <StorySection title="In form context" description="Multiple checkboxes with consistent spacing.">
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
