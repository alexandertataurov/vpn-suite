import type { Meta, StoryObj } from "@storybook/react";
import { RelativeTime } from "./RelativeTime";

const meta: Meta<typeof RelativeTime> = {
  title: "Shared/Patterns/RelativeTime",
  component: RelativeTime,
  parameters: {
    docs: {
      description: {
        component: "Human-readable relative time (e.g. 2 hours ago). Updates live.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RelativeTime>;

export const RelativeTimeOverview: Story = {
  args: { date: new Date(Date.now() - 5 * 60 * 1000) },
};

export const RelativeTimeVariants: Story = {
  render: () => (
    <div className="sb-row">
      <RelativeTime date={new Date(Date.now() - 5 * 60 * 1000)} />
      <RelativeTime date={new Date(Date.now() - 2 * 60 * 60 * 1000)} />
      <RelativeTime date={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)} />
    </div>
  ),
};

export const RelativeTimeSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized text.</p>
      <RelativeTime date={new Date(Date.now() - 5 * 60 * 1000)} />
    </div>
  ),
};

export const RelativeTimeStates: Story = {
  render: () => (
    <RelativeTime date={new Date(Date.now() - 60 * 1000)} updateInterval={5000} />
  ),
};

export const RelativeTimeWithLongText: Story = {
  args: { date: new Date(Date.now() - 60 * 1000), title: "2025-01-01 12:00:00 UTC" },
};

export const RelativeTimeAccessibility: Story = {
  args: { date: new Date(Date.now() - 60 * 1000), title: new Date().toISOString() },
};

export const RelativeTimeDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { date: new Date(Date.now() - 5 * 60 * 1000) },
};

export const RelativeTimeEdgeCases = WithLongText;
