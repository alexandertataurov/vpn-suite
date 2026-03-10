import type { Meta, StoryObj } from "@storybook/react";
import { Field, Input, Label, HelperText } from "../components";

const meta = {
  title: "Design System/Components/Form",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "Field composes Label + slot + HelperText. Use for forms." },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const FieldWithInput: Story = {
  render: () => (
    <Field label="Email" description="We’ll never share your email." error="">
      <Input type="email" placeholder="you@example.com" aria-invalid={false} />
    </Field>
  ),
};

export const FieldWithError: Story = {
  render: () => (
    <Field label="Username" error="Username is required">
      <Input type="text" placeholder="username" aria-invalid />
      <HelperText variant="error">Username is required</HelperText>
    </Field>
  ),
};

export const LabelAndHelperText: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor="a">Label</Label>
      <HelperText>Helper text below input</HelperText>
      <HelperText variant="error">Error helper</HelperText>
    </div>
  ),
};
