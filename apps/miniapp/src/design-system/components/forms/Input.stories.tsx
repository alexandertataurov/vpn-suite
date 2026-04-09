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
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Text input for labeled form fields. Use it for free-form text entry and pair it with helper, error, or success messages when needed.",
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password"], table: { category: "Behavior" } },
    label: { control: "text", table: { category: "Content" } },
    placeholder: { control: "text", table: { category: "Content" } },
    description: { control: "text", table: { category: "Content" } },
    required: { control: "boolean", table: { category: "State" } },
    error: { control: "text", table: { category: "State" } },
    success: { control: "text", table: { category: "State" } },
    disabled: { control: "boolean", table: { category: "State" } },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Baseline single-line input for a labeled field. This is the default contract for free-form text entry.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline single-line input for labeled text entry.">
      <StoryShowcase>
        <Input {...args} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithDescription: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Helper text example for explaining constraints before the user types.",
      },
    },
  },
  render: () => (
    <StorySection title="With helper text" description="Use helper text to explain constraints before the user types.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Error and success states shown together so validation feedback stays consistent across forms.",
      },
    },
  },
  render: () => (
    <StorySection title="Validation states" description="Show the error only when validation fails and the success state once a field is confirmed.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Disabled field example for read-only or unavailable input states.",
      },
    },
  },
  render: () => (
    <StorySection title="Disabled" description="Use disabled for unavailable actions; keep the value visible.">
      <StoryShowcase>
        <Input label="Protocol" value="AmneziaWG" disabled />
      </StoryShowcase>
    </StorySection>
  ),
};

export const FormContext: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Three-field form context that shows label rhythm, spacing, and focus order in a realistic stack.",
      },
    },
  },
  render: () => (
    <StorySection title="In form context" description="Three-field form for realistic spacing and label rhythm.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Stress test for long values and long placeholders so wrapping and truncation behavior stays predictable.",
      },
    },
  },
  render: () => (
    <StorySection title="Content stress" description="Long values and long placeholders should not break the layout.">
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
