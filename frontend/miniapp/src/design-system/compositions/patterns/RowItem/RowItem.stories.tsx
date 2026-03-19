import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  IconBox,
  IconGlobe,
  IconHelpCircle,
  IconMessageCircle,
  IconMonitor,
  IconRotateCw,
  IconSettings,
  IconShield,
  IconTrash2,
  IconUser,
} from "@/design-system/icons";
import { Badge, CardRow, RowItem, RowItemSkeleton, SectionLabel, Switch } from "@/design-system";

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

const meta: Meta<typeof RowItem> = {
  title: "Components/RowItem",
  tags: ["autodocs"],
  component: RowItem,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Settings row: icon + label/subtitle + right slot + chevron. Single horizontal layout.",
      },
    },
  },
} satisfies Meta<typeof RowItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  parameters: {
    docs: {
      description: {
        story: "Label + subtitle + chevron. The standard settings row.",
      },
    },
  },
  args: {
    icon: <IconSettings size={15} strokeWidth={2} />,
    label: "Account",
    subtitle: "Manage email and password",
    onClick: () => {},
  },
  render: (args) => (
    <WithThemes>
      <CardRow>
        <RowItem {...args} />
      </CardRow>
    </WithThemes>
  ),
};

export const Variants: Story = {
  name: "Icon variants",
  parameters: {
    docs: {
      description: {
        story:
          "default, danger, warning icon treatments. Danger and warning for destructive or urgent actions.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <RowItem
          icon={<IconSettings size={15} strokeWidth={2} />}
          iconVariant="default"
          label="Account"
          subtitle="Manage email and password"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconGlobe size={15} strokeWidth={2} />}
          iconVariant="default"
          label="Language"
          subtitle="Telegram default → English"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconRotateCw size={15} strokeWidth={2} />}
          iconVariant="warning"
          label="Reset configs"
          subtitle="Remove access from all devices"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconTrash2 size={15} strokeWidth={2} />}
          iconVariant="danger"
          label="Delete account"
          subtitle="Permanently remove your account"
          onClick={() => {}}
        />
      </CardRow>
    </WithThemes>
  ),
};

export const Loading: Story = {
  name: "Loading skeleton",
  parameters: {
    docs: {
      description: {
        story: "Shown while row data is fetching.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <RowItemSkeleton />
        <RowItemSkeleton />
      </CardRow>
    </WithThemes>
  ),
};

export const EmptyState: Story = {
  name: "Empty card row",
  parameters: {
    docs: {
      description: {
        story: "When a section has no items yet.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <div className="card-row-empty">No devices added yet</div>
      </CardRow>
    </WithThemes>
  ),
};

export const WithSectionLabel: Story = {
  name: "With section label",
  parameters: {
    docs: {
      description: {
        story: "Standard grouped settings layout.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <SectionLabel label="Profile" />
      <CardRow>
        <RowItem
          icon={<IconUser size={15} strokeWidth={2} />}
          label="Edit profile"
          subtitle="Update name and email"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconGlobe size={15} strokeWidth={2} />}
          label="Language"
          subtitle="Telegram default → English"
          onClick={() => {}}
        />
      </CardRow>
      <SectionLabel label="Danger zone" />
      <CardRow>
        <RowItem
          icon={<IconTrash2 size={15} strokeWidth={2} />}
          iconVariant="danger"
          label="Delete account"
          subtitle="Permanently remove your account"
          onClick={() => {}}
        />
      </CardRow>
    </WithThemes>
  ),
};

export const KeyboardNav: Story = {
  name: "Keyboard navigation",
  parameters: {
    docs: {
      description: {
        story:
          "Tab to focus rows, Enter/Space to activate. Focus ring uses --color-accent. Tab through rows in this story to verify focus ring.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <RowItem
          icon={<IconSettings size={15} strokeWidth={2} />}
          label="Account"
          subtitle="Manage email and password"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconShield size={15} strokeWidth={2} />}
          label="Security"
          subtitle="Two-factor and sessions"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconGlobe size={15} strokeWidth={2} />}
          label="Language"
          subtitle="English"
          onClick={() => {}}
        />
      </CardRow>
    </WithThemes>
  ),
};

export const WithBadge: Story = {
  name: "With badge",
  parameters: {
    docs: {
      description: {
        story: "Right-side badge for status or urgency signals.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <RowItem
          icon={<IconBox size={15} strokeWidth={2} />}
          label="Subscription"
          subtitle="Expires Mar 24 · Pro annual"
          right={<Badge label="14d left" variant="warning" />}
          onClick={() => {}}
        />
        <RowItem
          icon={<IconMonitor size={15} strokeWidth={2} />}
          label="Manage Devices"
          subtitle="2 of 5 active"
          right={<Badge label="Full" variant="muted" />}
          onClick={() => {}}
        />
      </CardRow>
    </WithThemes>
  ),
};

export const WithToggle: Story = {
  name: "With toggle",
  parameters: {
    docs: {
      description: {
        story: "Right-side toggle for boolean settings (auto-renew etc.).",
      },
    },
  },
  render: function WithToggleStory() {
    const [checked, setChecked] = useState(true);
    return (
      <WithThemes>
        <CardRow>
          <RowItem
            icon={<IconRotateCw size={15} strokeWidth={2} />}
            label="Auto-renew"
            subtitle="Renews on Mar 24, 2026. Charged via Telegram."
            right={<Switch checked={checked} onCheckedChange={setChecked} aria-label="Auto-renew" />}
            showChevron={false}
            onClick={() => setChecked(!checked)}
          />
        </CardRow>
      </WithThemes>
    );
  },
};

export const LabelOnly: Story = {
  name: "Label only",
  parameters: {
    docs: {
      description: {
        story: "No subtitle — used for simple navigation rows.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        <RowItem
          icon={<IconShield size={15} strokeWidth={2} />}
          label="Setup guide"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconHelpCircle size={15} strokeWidth={2} />}
          label="FAQ"
          onClick={() => {}}
        />
        <RowItem
          icon={<IconMessageCircle size={15} strokeWidth={2} />}
          label="Contact support"
          onClick={() => {}}
        />
      </CardRow>
    </WithThemes>
  ),
};

export const Responsive: Story = {
  name: "Responsive — long text",
  parameters: {
    docs: {
      description: {
        story: "Labels truncate at narrow widths. Subtitle truncates too.",
      },
    },
  },
  render: function ResponsiveStory() {
    const [width, setWidth] = useState(390);
    return (
      <WithThemes>
        <div style={{ width: "100%", maxWidth: 390 }}>
          <input
            type="range"
            min={240}
            max={390}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ marginBottom: 12, width: "100%" }}
            aria-label="Width in pixels"
          />
          <CardRow style={{ width, overflow: "hidden" }}>
            <RowItem
              icon={<IconSettings size={15} strokeWidth={2} />}
              label="Manage email, password and account preferences"
              subtitle="Last updated March 14, 2026 · Account ID: 84920"
              onClick={() => {}}
            />
          </CardRow>
        </div>
      </WithThemes>
    );
  },
};
