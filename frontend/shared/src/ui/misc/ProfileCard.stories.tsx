import type { Meta, StoryObj } from "@storybook/react";
import { ProfileCard } from "./ProfileCard";
import { Button } from "../buttons/Button";

const meta: Meta<typeof ProfileCard> = {
  title: "Components/ProfileCard",
  component: ProfileCard,
  parameters: {
    docs: {
      description: {
        component: "User profile card. Name, optional subtitle.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileCard>;

export const Overview: Story = {
  args: { planName: "Pro", validUntil: "2025-12-31", status: "active" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <ProfileCard planName="Pro" validUntil="2025-12-31" status="active" />
      <ProfileCard planName="Basic" validUntil="2023-01-01" status="expired" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses card tokens.</p>
      <ProfileCard planName="Pro" validUntil="2025-12-31" status="active" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <ProfileCard
      planName="Pro"
      validUntil="2025-12-31"
      status="active"
      primaryAction={<Button variant="secondary" size="sm">Renew</Button>}
    />
  ),
};

export const WithLongText: Story = {
  args: {
    planName: "Enterprise subscription with extended name",
    validUntil: "2025-12-31",
    status: "active",
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { planName: "Pro", validUntil: "2025-12-31", status: "active" },
};

export const Accessibility: Story = {
  args: { planName: "Pro", validUntil: "2025-12-31", status: "active" },
};

export const EdgeCases = WithLongText;
