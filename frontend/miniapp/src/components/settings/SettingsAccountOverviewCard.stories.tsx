import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsAccountOverviewCard } from "./SettingsAccountOverviewCard";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SettingsAccountOverviewCard> = {
  title: "Recipes/SettingsAccountOverviewCard",
  tags: ["autodocs"],
  component: SettingsAccountOverviewCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Account overview card with avatar, name, status, renewal info, and plan CTA.",
      },
    },
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

type Story = StoryObj<typeof meta>;

const baseArgs = {
  initial: "AM",
  name: "Alex Morgan",
  eyebrowLabel: "Account",
  statusLabel: "Active",
  renewalEyebrowLabel: "RENEWAL",
  renewalLabel: "—",
  planActionTo: "/plan",
  planCtaLabel: "Choose plan",
};

export const WithPlan: Story = {
  args: {
    ...baseArgs,
    hasPlan: true,
    planBadgeLabel: "Pro Monthly",
    renewalValue: "Apr 15, 2026",
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsAccountOverviewCard {...args} />
    </StoryShowcase>
  ),
};

export const WithoutPlan: Story = {
  args: {
    ...baseArgs,
    hasPlan: false,
    planBadgeLabel: null,
    renewalValue: null,
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsAccountOverviewCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="With plan, without plan, with photo.">
      <StoryStack>
        <SettingsAccountOverviewCard
          {...baseArgs}
          hasPlan={true}
          planBadgeLabel="Pro Annual"
          renewalValue="Dec 1, 2026"
        />
        <SettingsAccountOverviewCard
          {...baseArgs}
          hasPlan={false}
          planBadgeLabel={null}
          renewalValue={null}
        />
        <SettingsAccountOverviewCard
          {...baseArgs}
          initial="JD"
          name="Jane Doe"
          photoUrl="https://i.pravatar.cc/128?u=jd"
          hasPlan={true}
          planBadgeLabel="Beta"
          renewalValue={null}
        />
      </StoryStack>
    </StorySection>
  ),
};
