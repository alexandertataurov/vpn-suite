import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "./InlineAlert";

const meta = {
  title: "Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  argTypes: {
    variant: { control: "select", options: ["info", "warning", "error", "success"] },
  },
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "info", title: "Info", message: "Inline alert message." },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
      <InlineAlert variant="info" title="Info" message="Info message" />
      <InlineAlert variant="warning" title="Warning" message="Warning message" />
      <InlineAlert variant="error" title="Error" message="Error message" />
      <InlineAlert variant="success" title="Success" message="Success message" />
    </div>
  ),
};
