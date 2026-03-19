import type { Meta, StoryObj } from "@storybook/react";
import { NoDeviceCallout } from "./NoDeviceCallout";
import { CardRow, PlanCard, RowItem } from "@/design-system";
import { IconBox } from "@/design-system/icons";

function ThemePane({
  theme,
  children,
  narrow = false,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      data-theme={theme}
      className={`story-theme-pane ${narrow ? "story-theme-pane--no-device-narrow" : "story-theme-pane--no-device"}`}
    >
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

const meta: Meta<typeof NoDeviceCallout> = {
  title: "Patterns/NoDeviceCallout",
  tags: ["autodocs"],
  component: NoDeviceCallout,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Shown when the user has an active plan but has not added any devices yet. §4.9",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  parameters: {
    docs: {
      description: {
        story: "Shown when user has an active plan but has not added any devices yet. §4.9",
      },
    },
  },
  render: () => (
    <WithThemes>
      <NoDeviceCallout
        title="No devices added"
        subtitle="Add a device to generate your configuration."
        onAddDevice={() => {}}
      />
    </WithThemes>
  ),
};

export const CustomCopy: Story = {
  name: "Custom copy",
  parameters: {
    docs: {
      description: {
        story: "Copy adapts to context — e.g. after purchase.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <NoDeviceCallout
        title="Ready to connect"
        subtitle="Your Pro plan is active. Add a device to get started."
        onAddDevice={() => {}}
      />
    </WithThemes>
  ),
};

export const InContext: Story = {
  name: "In context — Home screen",
  parameters: {
    docs: {
      description: {
        story: "NoDeviceCallout between PlanCard and action rows, as shown in the No Device state of the home screen.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div className="nd-story-stack">
        <PlanCard
          plan="Pro"
          planSub="Annual"
          status="active"
          devices={0}
          deviceLimit={5}
          renewsLabel="Apr 1"
        />
        <NoDeviceCallout
          title="No devices added"
          subtitle="Add a device to generate your configuration."
          onAddDevice={() => {}}
        />
        <CardRow>
          <RowItem
            icon={<IconBox size={15} strokeWidth={2} aria-hidden />}
            label="Subscription"
            subtitle="Pro annual · renews Apr 1"
          />
        </CardRow>
      </div>
    </WithThemes>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (320px)",
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
    docs: {
      description: {
        story: "CTA wraps below body text at 320px width.",
      },
    },
  },
  render: () => (
    <ThemePane theme="dark" narrow>
      <NoDeviceCallout
        title="No devices added"
        subtitle="Add a device to generate your configuration."
        onAddDevice={() => {}}
      />
    </ThemePane>
  ),
};
