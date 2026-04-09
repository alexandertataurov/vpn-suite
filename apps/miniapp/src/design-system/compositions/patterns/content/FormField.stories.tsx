import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./ContentForms";
import { Input } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof FormField> = {
  title: "Patterns/FormField",
  tags: ["autodocs"],
  component: FormField,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Form field wrapper that handles label, helper text, validation states, and optional actions without duplicating layout logic.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    input: <Input placeholder="you@example.com" />,
  },
  render: (args) => (
    <StorySection title="Default" description="Label plus input with the wrapper handling spacing and alignment.">
      <StoryShowcase>
        <FormField {...args} />
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default field wrapper with the shared label and input spacing already applied. Use it to confirm alignment before adding helper or validation text.",
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Idle, error, and success states kept in the same column width.">
      <StoryShowcase>
        <StoryStack>
          <FormField label="Email" input={<Input placeholder="you@example.com" />} />
          <FormField
            label="Email"
            state="error"
            errorMessage="Invalid email format"
            input={<Input placeholder="bad" />}
          />
          <FormField
            label="Email"
            state="success"
            successMessage="Looks good"
            input={<Input value="you@example.com" readOnly />}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Idle, error, and success field states shown in a single width. This keeps validation copy comparable and makes layout drift obvious.",
      },
    },
  },
};
