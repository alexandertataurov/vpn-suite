import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { SettingsAccountOverviewCard } from "./SettingsAccountOverviewCard";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane story-theme-pane--account-card">
      <p className="story-theme-pane-label">{theme}</p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: ReactNode }) {
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
        component:
          "Account overview card used at the top of settings, pairing identity details with renewal and device stats.",
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

export const Default: Story = {
  args: activeArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = await canvas.findByRole("button", { name: /Alex Morgan/i });
    await userEvent.tab();
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute("type", "button");
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary account summary card with the default active-plan presentation. The editable variant is now a real button, so keyboard users can focus and activate it directly.",
      },
    },
  },
  render: (args) => (
    <WithThemes>
      <SettingsAccountOverviewCard {...args} />
    </WithThemes>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="story-stack">
      <WithThemes>
        <SettingsAccountOverviewCard {...activeArgs} />
      </WithThemes>
      <WithThemes>
        <SettingsAccountOverviewCard
          {...activeArgs}
          planStatus="expiring"
          renewalDate="Mar 24, 2026"
          devicesUsed={3}
          devicesTotal={5}
        />
      </WithThemes>
      <WithThemes>
        <SettingsAccountOverviewCard {...activeArgs} onEdit={undefined} />
      </WithThemes>
    </div>
  ),
};
