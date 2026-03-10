import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "../components/feedback/InlineAlert";

const meta = {
  title: "Design System/Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  parameters: {
    docs: { description: { component: "Inline alert with variant (info, warning, error, success)." } },
  },
  argTypes: { variant: { control: "select", options: ["info", "warning", "error", "success"] } },
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: { variant: "info", title: "Info", children: "Informational message." },
};

export const Warning: Story = {
  args: { variant: "warning", title: "Warning", children: "Warning message." },
};

export const Error: Story = {
  args: { variant: "error", title: "Error", children: "Error message." },
};

export const Success: Story = {
  args: { variant: "success", title: "Success", children: "Success message." },
};
