import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { Checkbox } from "./Checkbox";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/Checkbox",
  tags: ["autodocs"],
  component: Checkbox,
  args: {
    label: "Accept terms and conditions",
    checked: false,
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Checkbox form control with label, description, and validation states. Use it for binary choices that need explicit consent or opt-in wording.",
      },
    },
  },
  argTypes: {
    label: { control: "text", table: { category: "Content" } },
    description: { control: "text", table: { category: "Content" } },
    checked: { control: "boolean", table: { category: "State" } },
    disabled: { control: "boolean", table: { category: "State" } },
    required: { control: "boolean", table: { category: "State" } },
    error: { control: "text", table: { category: "State" } },
    success: { control: "text", table: { category: "State" } },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Single checkbox with a clear consent label. This is the default contract for opt-in fields.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline checkbox for explicit consent and opt-in choices.">
      <StoryShowcase>
        <Checkbox {...args} />
      </StoryShowcase>
    </StorySection>
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

export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [{ checked }, updateArgs] = useArgs();
    return (
      <StorySection title="Interactive" description="Toggle the checkbox to confirm controlled state updates.">
        <StoryShowcase>
          <Checkbox
            {...args}
            label={args.label ?? "I agree to the terms"}
            checked={checked}
            onChange={(e) => updateArgs({ checked: e.target.checked })}
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
