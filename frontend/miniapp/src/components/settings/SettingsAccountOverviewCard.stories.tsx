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
  title: "Patterns/SettingsAccountCard",
  tags: ["autodocs"],
  component: SettingsAccountOverviewCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Account overview card with two-zone layout: identity (avatar, name, plan chip) and stats (renewal, devices, status). Tokenized for light/dark themes.",
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
  name: "Active plan",
  args: activeArgs,
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const Expiring: Story = {
  name: "Expiring plan",
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

export const Expired: Story = {
  name: "Expired plan",
  args: {
    ...activeArgs,
    planStatus: "expired",
    renewalDate: "Mar 10, 2026",
    devicesUsed: 0,
    devicesTotal: 2,
  },
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const LongName: Story = {
  name: "Long name truncation",
  args: {
    ...activeArgs,
    name: "Alexandros Papadopoulos-Konstantinidis",
    initials: "AP",
    planStatus: "active",
    renewalDate: "Apr 15, 2026",
    devicesUsed: 1,
    devicesTotal: 3,
  },
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const Readonly: Story = {
  name: "Without edit action",
  parameters: {
    docs: {
      description: {
        story: "No chevron, no hover state — display only.",
      },
    },
  },
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
