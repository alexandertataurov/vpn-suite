import type { Meta, StoryObj } from "@storybook/react";
import { InlineError } from "./InlineError";

const meta: Meta<typeof InlineError> = {
  title: "Shared/Primitives/Forms/InlineError",
  component: InlineError,
  parameters: {
    docs: {
      description: {
        component: "Inline error message. Use with form fields.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InlineError>;

export const InlineErrorOverview: Story = {
  args: { message: "This field is required" },
};

export const InlineErrorVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineError message="This field is required" />
      <InlineError message="Email must be valid" />
    </div>
  ),
};

export const InlineErrorSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses caption tokens.</p>
      <InlineError message="Error text" />
    </div>
  ),
};

export const InlineErrorStates: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineError message="Error state" />
    </div>
  ),
};

export const InlineErrorWithLongText: Story = {
  args: { message: "Long error message that should wrap without breaking layout or overlapping form controls." },
};

export const InlineErrorDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { message: "This field is required" },
};

export const InlineErrorAccessibility: Story = {
  args: { message: "Error announced to screen readers" },
};

export const InlineErrorEdgeCases = WithLongText;
