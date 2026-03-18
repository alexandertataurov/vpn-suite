import type { Meta, StoryObj } from "@storybook/react";
import { RenewalBanner } from "./RenewalBanner";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane">
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

const meta: Meta<typeof RenewalBanner> = {
  title: "Recipes/RenewalBanner",
  tags: ["autodocs"],
  component: RenewalBanner,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Renewal banner per amnezia spec §4.4. Expiring or expired subscription prompt. Uses design tokens.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["warning", "danger", "expiring", "expired"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "warning",
    title: "Subscription expires in 14 days",
    subtitle: "Renew now to keep your plan active.",
    badge: "14d left",
    onClick: () => {},
  },
};

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Warning = expiring subscription (days remaining). Danger = expired (access lost, renew immediately). Left accent strip provides instant peripheral recognition.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <RenewalBanner
          variant="warning"
          title="Subscription expires in 14 days"
          subtitle="Renew now to keep your plan active."
          badge="14d left"
          onClick={() => {}}
        />
        <RenewalBanner
          variant="danger"
          title="Subscription expired"
          subtitle="Renew to restore access."
          onClick={() => {}}
        />
      </div>
    </WithThemes>
  ),
};

export const WithBadge: Story = {
  name: "With urgency badge",
  parameters: {
    docs: {
      description: {
        story:
          "Badge reinforces days remaining — matches the badge shown in the Subscription row item for visual consistency.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <RenewalBanner
          variant="warning"
          title="Subscription expires in 14 days"
          subtitle="Renew now to keep your plan active."
          badge="14d left"
          onClick={() => {}}
        />
        <RenewalBanner
          variant="warning"
          title="Subscription expires in 3 days"
          subtitle="Renew now to keep your plan active."
          badge="3d left"
          onClick={() => {}}
        />
        <RenewalBanner
          variant="warning"
          title="Subscription expires today"
          subtitle="Renew now to keep your plan active."
          badge="Today"
          onClick={() => {}}
        />
      </div>
    </WithThemes>
  ),
};

export const Responsive: Story = {
  name: "Responsive",
  parameters: {
    docs: {
      description: {
        story: "On narrow viewports title and badge stack vertically.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div
        style={{
          width: 390,
          overflow: "hidden",
          animation: "header-responsive-shrink 3s ease-in-out 0.5s forwards",
        }}
      >
        <RenewalBanner
          variant="warning"
          title="Subscription expires in 14 days"
          subtitle="Renew now to keep your plan active."
          badge="14d left"
          onClick={() => {}}
        />
      </div>
    </WithThemes>
  ),
};
