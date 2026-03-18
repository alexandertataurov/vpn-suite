import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { ProfileRow } from "./ProfileRow";
import { PageHeader } from "../shared/PageHeader";
import { ModernHeader } from "./ModernHeader";
import { PillChip, SettingsButton } from "../../patterns";
import { StorySection, StoryShowcase } from "@/design-system";

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

const meta: Meta = {
  title: "Recipes/Home/Header",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

/* ----- ProfileRow ----- */
export const ProfileRowStory: StoryObj = {
  name: "Profile row",
  parameters: {
    docs: {
      description: {
        story:
          "Home screen header. Single horizontal row — avatar, name, plan chip, settings button.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 358 }}>
        <ProfileRow
          name="Alex T."
          initials="AT"
          status="beta"
          onSettings={() => {}}
        />
        <ProfileRow
          name="Alex T."
          initials="AT"
          status="active"
          planName="PRO"
          onSettings={() => {}}
        />
        <ProfileRow
          name="Alex T."
          initials="AT"
          status="expiring"
          planName="PRO"
          daysLeft={14}
          onSettings={() => {}}
        />
        <ProfileRow
          name="Alex T."
          initials="AT"
          status="expired"
          onSettings={() => {}}
        />
      </div>
    </WithThemes>
  ),
};

/* ----- PageHeader ----- */
export const PageHeaderStory: StoryObj = {
  name: "Page header",
  parameters: {
    docs: {
      description: {
        story:
          "Inner page header with back button, title, subtitle, and optional right action.",
      },
    },
  },
  render: () => (
    <WithThemes>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <PageHeader title="Settings" onBack={() => {}} />
        <PageHeader
          title="Settings"
          subtitle="Manage plan, billing, support, and account actions."
          onBack={() => {}}
        />
        <PageHeader
          title="Plan & Billing"
          subtitle="Manage your plan, renewal, and device access."
          onBack={() => {}}
          action={<SettingsButton onClick={() => {}} />}
        />
      </div>
    </WithThemes>
  ),
};

/* ----- Responsive ----- */
export const ResponsiveStory: StoryObj = {
  name: "Responsive — long title",
  parameters: {
    docs: {
      description: {
        story:
          "Title truncates at narrow widths. Subtitle wraps to multiple lines.",
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
        <PageHeader
          title="Subscription & Device Management"
          subtitle="Manage your active devices, view your current plan, and update billing preferences at any time."
          onBack={() => {}}
        />
      </div>
    </WithThemes>
  ),
};

/* ----- ModernHeader ----- */
export const ModernHeaderDefault: StoryObj = {
  name: "ModernHeader — default",
  render: () => (
    <StoryShowcase>
      <ModernHeader
        displayName="Alex"
        subtitle="Pro Monthly"
        pillChip={<PillChip variant="active">PRO</PillChip>}
        showSettings
        onSettingsClick={() => {}}
      />
    </StoryShowcase>
  ),
};

export const ModernHeaderVariants: StoryObj = {
  name: "ModernHeader — variants",
  render: () => (
    <StorySection
      title="Variants"
      description="Home profile vs inner page title."
    >
      <StoryShowcase>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ModernHeader
            displayName="Alex"
            subtitle="Pro Monthly"
            pillChip={<PillChip variant="active">PRO</PillChip>}
            onSettingsClick={() => {}}
          />
          <ModernHeader title="Settings" onBack={() => {}} showSettings={false} />
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};
