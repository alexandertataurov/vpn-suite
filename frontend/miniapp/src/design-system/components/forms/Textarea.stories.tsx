import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/Textarea",
  tags: ["autodocs"],
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Multi-line text input with optional label, description, and error state. Use it when the user needs room for longer free-form text.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    success: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Support message",
    placeholder: "Describe your issue…",
  },
  render: (args) => (
    <StoryShowcase>
      <Textarea {...args} />
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default support message textarea with placeholder text. This is the baseline contract for multi-line entry.",
      },
    },
  },
};

export const ValidationStates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Error and success feedback shown side by side to confirm state handling.",
      },
    },
  },
  render: () => (
    <StorySection title="Validation states" description="Error and success feedback side by side.">
      <StoryShowcase>
        <StoryStack>
          <Textarea label="Feedback" placeholder="Your feedback" error="This field is required" />
          <Textarea label="Notes" value="Saved successfully" success="Saved" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ContentStress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Long labels, long placeholders, and long values to verify wrap behavior under pressure.",
      },
    },
  },
  render: () => (
    <StorySection title="Content stress" description="Long text and long placeholder content.">
      <StoryShowcase>
        <Textarea
          label="Description"
          placeholder="Enter a very long placeholder to test how the textarea handles overflow and wrapping behavior"
          value="Pre-filled content that extends across multiple lines to demonstrate how the textarea displays longer text."
        />
      </StoryShowcase>
    </StorySection>
  ),
};
