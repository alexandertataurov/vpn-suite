import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState, InlineAlert, PageError } from "@/design-system";

const meta: Meta<typeof ErrorState> = {
  title: "Patterns/ErrorStates",
  component: ErrorState,
  parameters: {
    docs: {
      description: {
        component: "Error state patterns: inline error, panel error, page error.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorState>;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineAlert variant="error" title="Failed to load" message="Try again in a few minutes." />
      <ErrorState title="Failed to load telemetry" message="Network error. Please retry." retry={() => {}} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <InlineAlert variant="warning" title="Warning" message="This is a warning." />
      <InlineAlert variant="error" title="Error" message="This is an error." />
      <ErrorState title="Failed to load telemetry" message="Network error. Please retry." retry={() => {}} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <ErrorState title="Failed to load" message="Network error." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <ErrorState title="Failed to load" message="Network error." />
  ),
};

export const PageLevel: Story = {
  render: () => (
    <PageError
      title="Something went wrong"
      message="The admin API returned an error."
      onRetry={() => {}}
    />
  ),
};

export const WithLongText: Story = {
  render: () => (
    <ErrorState
      title="Telemetry unavailable for the selected time window"
      message="The data source stopped reporting and has not recovered. Review the collector logs and verify network access before retrying."
      retry={() => {}}
    />
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <ErrorState title="Failed to load" message="Network error." retry={() => {}} />
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ErrorState title="Error state" message="Announced via role=alert when appropriate." />
  ),
};

export const EdgeCases = WithLongText;
