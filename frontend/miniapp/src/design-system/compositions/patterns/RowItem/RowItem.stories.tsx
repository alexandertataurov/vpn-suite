import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  IconBox,
  IconGlobe,
  IconHelpCircle,
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
  title: "Patterns/RowItem",
  tags: ["autodocs"],
  component: RowItem,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Settings row with icon, label and subtitle, optional right slot, and optional chevron.",
      },
    },
  },
} satisfies Meta<typeof RowItem>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseRowArgs = {
  icon: <IconSettings size={15} strokeWidth={2} />,
  label: "Account",
  subtitle: "Manage email and password",
  onClick: () => {},
};

const baseRows = {
  account: (
    <RowItem
      icon={<IconSettings size={15} strokeWidth={2} />}
      label="Account"
      subtitle="Manage email and password"
      onClick={() => {}}
    />
  ),
  language: (
    <RowItem
      icon={<IconGlobe size={15} strokeWidth={2} />}
      label="Language"
      subtitle="Telegram default → English"
      onClick={() => {}}
    />
  ),
  faq: (
    <RowItem
      icon={<IconHelpCircle size={15} strokeWidth={2} />}
      label="FAQ"
      onClick={() => {}}
    />
  ),
  danger: (
    <RowItem
      icon={<IconTrash2 size={15} strokeWidth={2} />}
      iconVariant="danger"
      label="Delete account"
      subtitle="Permanently remove your account"
      onClick={() => {}}
    />
  ),
};

export const Default: Story = {
  name: "Default",
  parameters: {
    docs: {
      description: {
        story: "Label, subtitle, and chevron. The standard settings row.",
      },
    },
  },
  args: {
    ...baseRowArgs,
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
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Icon treatments, badge rows, toggle rows, label-only navigation rows, loading skeletons, and empty-card states.",
      },
    },
  },
  render: function VariantsStory() {
    const [checked, setChecked] = useState(true);
    return (
      <WithThemes>
        <CardRow>
          {baseRows.account}
          {baseRows.language}
          <RowItem
            icon={<IconRotateCw size={15} strokeWidth={2} />}
            iconVariant="warning"
            label="Reset configs"
            subtitle="Remove access from all devices"
            onClick={() => {}}
          />
          {baseRows.danger}
          <RowItem
            icon={<IconBox size={15} strokeWidth={2} />}
            label="Subscription"
            subtitle="Expires Mar 24 · Pro annual"
            right={<Badge label="14d left" variant="warning" />}
            onClick={() => {}}
          />
          <RowItem
            icon={<IconRotateCw size={15} strokeWidth={2} />}
            label="Auto-renew"
            subtitle="Renews on Mar 24, 2026. Charged via Telegram."
            right={<Switch checked={checked} onCheckedChange={setChecked} aria-label="Auto-renew" />}
            showChevron={false}
            onClick={() => setChecked(!checked)}
          />
          {baseRows.faq}
        </CardRow>
        <CardRow>
          <RowItemSkeleton />
          <RowItemSkeleton />
        </CardRow>
        <CardRow>
          <div className="card-row-empty">No devices added yet</div>
        </CardRow>
      </WithThemes>
    );
  },
};

export const InContext: Story = {
  name: "In context",
  parameters: {
    docs: {
      description: {
        story: "Standard grouped settings layout for profile and danger-zone sections.",
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
        {baseRows.language}
      </CardRow>
      <SectionLabel label="Danger zone" />
      <CardRow>
        {baseRows.danger}
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
          "Tab to focus rows, Enter or Space to activate. Focus ring uses `--color-accent`.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <CardRow>
        {baseRows.account}
        <RowItem
          icon={<IconShield size={15} strokeWidth={2} />}
          label="Security"
          subtitle="Two-factor and sessions"
          onClick={() => {}}
        />
        <RowItem icon={<IconGlobe size={15} strokeWidth={2} />} label="Language" subtitle="English" onClick={() => {}} />
      </CardRow>
    </WithThemes>
  ),
};

export const Responsive: Story = {
  name: "Responsive — long text",
  parameters: {
    docs: {
      description: {
        story: "Labels and subtitles truncate at narrow widths without breaking the row layout.",
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
