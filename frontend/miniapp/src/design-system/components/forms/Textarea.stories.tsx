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
          "Multi-line text input with optional label, description, error. Uses Field primitive and design tokens.",
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
};

export const ValidationStates: Story = {
  render: () => (
    <StorySection title="Validation states" description="Error and success feedback.">
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
  render: () => (
    <StorySection title="Content stress" description="Long text and placeholder.">
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
