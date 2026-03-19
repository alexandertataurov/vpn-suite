import type { Meta, StoryObj } from "@storybook/react";
import { SettingsAccountOverviewCard } from "./SettingsAccountOverviewCard";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane story-theme-pane--account-card">
      <p className="story-theme-pane-label">{theme}</p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: React.ReactNode }) {
  return (
    <div className="story-themes-row">
      <ThemePane theme="dark">{children}</ThemePane>
      <ThemePane theme="light">{children}</ThemePane>
    </div>
  );
}

const meta: Meta<typeof SettingsAccountOverviewCard> = {
  title: "Recipes/Settings/SettingsAccountOverviewCard",
  tags: ["autodocs"],
  component: SettingsAccountOverviewCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Account overview card used at the top of settings, pairing identity details with renewal and device stats.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const activeArgs = {
  name: "Alex Morgan",
  initials: "AM",
  planName: "Pro Monthly",
  planStatus: "active" as const,
  renewalDate: "Apr 15, 2026",
  devicesUsed: 2,
  devicesTotal: 5,
  onEdit: () => {},
};

export const Active: Story = {
  args: activeArgs,
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const Expiring: Story = {
  args: {
    ...activeArgs,
    planStatus: "expiring",
    renewalDate: "Mar 24, 2026",
    devicesUsed: 3,
    devicesTotal: 5,
  },
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const Readonly: Story = {
  args: {
    ...activeArgs,
    onEdit: undefined,
  },
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};
