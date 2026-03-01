import type { Meta, StoryObj } from "@storybook/react";
import { InlineError } from "@/design-system";

const meta: Meta<typeof InlineError> = {
  title: "Primitives/Forms/InlineError",
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

export const Overview: Story = {
  args: { message: "This field is required" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineError message="This field is required" />
      <InlineError message="Email must be valid" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses caption tokens.</p>
      <InlineError message="Error text" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineError message="Error state" />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { message: "Long error message that should wrap without breaking layout or overlapping form controls." },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { message: "This field is required" },
};

export const Accessibility: Story = {
  args: { message: "Error announced to screen readers" },
};

export const EdgeCases = WithLongText;
