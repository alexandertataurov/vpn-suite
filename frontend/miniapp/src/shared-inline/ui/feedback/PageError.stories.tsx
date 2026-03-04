import type { Meta, StoryObj } from "@storybook/react";
import { PageError } from "./PageError";

const meta: Meta<typeof PageError> = {
  title: "Shared/Components/PageError",
  component: PageError,
  parameters: {
    docs: {
      description: {
        component: "Page-level error (e.g. 404). Optional retry.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PageError>;

export const PageErrorOverview: Story = {
  args: { title: "Something went wrong", message: "An unexpected error occurred." },
};

export const PageErrorVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <PageError title="Something went wrong" message="An unexpected error occurred." />
      <PageError title="Failed to load" onRetry={() => {}} />
    </div>
  ),
};

export const PageErrorSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; width is tokenized.</p>
      <PageError title="Something went wrong" message="An unexpected error occurred." />
    </div>
  ),
};

export const PageErrorStates: Story = {
  args: { title: "Failed to load", onRetry: () => {} },
};

export const PageErrorWithLongText: Story = {
  args: { title: "Something went wrong", message: "Long error message that should wrap across multiple lines and remain readable in the page error container." },
};

export const PageErrorDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "Something went wrong", message: "An unexpected error occurred." },
};

export const PageErrorAccessibility: Story = {
  args: { title: "Something went wrong", message: "An unexpected error occurred." },
};

export const PageErrorEdgeCases = WithLongText;
