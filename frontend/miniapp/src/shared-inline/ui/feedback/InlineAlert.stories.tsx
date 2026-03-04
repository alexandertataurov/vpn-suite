import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "./InlineAlert";

const meta: Meta<typeof InlineAlert> = {
  title: "Shared/Primitives/Toast-Alert/InlineAlert",
  component: InlineAlert,
  parameters: {
    docs: {
      description: {
        component: `Inline feedback: info, warning, error.

**Purpose:** Form/section messages. Don't use for toasts.

**Variants:** info, warning, error.

**Accessibility:** role="alert" for errors. **Do:** Clear title + message. **Don't:** Overuse warning.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InlineAlert>;

export const InlineAlertOverview: Story = {
  args: { variant: "info", title: "Information", message: "This is an info message." },
};

export const InlineAlertVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineAlert variant="info" title="Information" message="This is an info message." />
      <InlineAlert variant="warning" title="Warning" message="Please check this." />
      <InlineAlert variant="error" title="Error" message="Something went wrong." />
    </div>
  ),
};

export const InlineAlertSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; alert spacing is tokenized.</p>
      <InlineAlert variant="info" title="Information" message="This is an info message." />
    </div>
  ),
};

export const InlineAlertStates: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineAlert variant="info" title="Information" message="This is an info message." />
    </div>
  ),
};

export const InlineAlertWithLongText: Story = {
  args: {
    variant: "warning",
    title: "Telemetry delay",
    message: "Long warning message that should wrap and remain readable within narrow containers.",
  },
};

export const InlineAlertDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { variant: "info", title: "Information", message: "This is an info message." },
};

export const InlineAlertAccessibility: Story = {
  args: { variant: "error", title: "Error", message: "Something went wrong." },
};

export const InlineAlertEdgeCases = WithLongText;
