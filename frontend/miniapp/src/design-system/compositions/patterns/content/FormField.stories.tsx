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
    docs: {
      description: {
        component:
          "Form field wrapper with label, validation states, helper/error/success messages, optional action slot.",
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
    <StoryShowcase>
      <FormField {...args} />
    </StoryShowcase>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Idle, error, success, required.">
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
};
