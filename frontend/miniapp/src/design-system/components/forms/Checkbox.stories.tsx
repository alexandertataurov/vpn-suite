import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
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
};

export const Checked: Story = {
  args: { label: "Subscribe to newsletter", checked: true },
};

export const WithDescription: Story = {
  args: {
    label: "Enable notifications",
    description: "Receive push notifications for important updates.",
    checked: false,
  },
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <Checkbox label="Default" checked={false} />
      <Checkbox label="Checked" checked />
      <Checkbox label="Error" checked={false} error="This field is required" />
      <Checkbox label="Success" checked success="Saved" />
      <Checkbox label="Disabled" checked={false} disabled />
    </Stack>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="I agree to the terms"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};
