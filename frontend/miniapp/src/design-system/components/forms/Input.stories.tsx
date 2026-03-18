import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import {
  StorySection,
  StoryShowcase,
  StoryStack,
} from "@/design-system";

const meta = {
  title: "Components/Input",
  tags: ["autodocs", "contract-test"],
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Text input with optional label, description, error, success. Uses Field primitive and design tokens.",
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password"] },
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    success: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
  render: (args) => (
    <StoryShowcase>
      <Input {...args} />
    </StoryShowcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <StorySection title="With helper text" description="Use for hints and guidance.">
      <StoryShowcase>
        <Input
          label="Username"
          placeholder="username"
          description="Choose a unique username. Letters and numbers only."
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <StorySection title="Validation states" description="Error and success feedback.">
      <StoryShowcase>
        <StoryStack>
          <Input
            label="Email"
            placeholder="you@example.com"
            error="Please enter a valid email address."
          />
          <Input
            label="Email"
            value="valid@example.com"
            success="Email verified"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StorySection title="Disabled" description="Read-only or unavailable field.">
      <StoryShowcase>
        <Input label="Protocol" value="AmneziaWG" disabled />
      </StoryShowcase>
    </StorySection>
  ),
};

export const FormContext: Story = {
  render: () => (
    <StorySection title="In form context" description="Realistic form with multiple fields.">
      <StoryShowcase>
        <StoryStack>
          <Input label="Email" placeholder="you@example.com" type="email" />
          <Input label="Password" placeholder="••••••••" type="password" />
          <Input label="Confirm password" placeholder="••••••••" type="password" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ContentStress: Story = {
  render: () => (
    <StorySection title="Content stress" description="Long text and placeholder.">
      <StoryShowcase>
        <StoryStack>
          <Input
            label="Server address"
            placeholder="vpn.example.com"
            value="very-long-server-hostname-that-might-overflow.example.com"
          />
          <Input
            label="Notes"
            placeholder="Enter a very long placeholder to test truncation behavior in the input field"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
