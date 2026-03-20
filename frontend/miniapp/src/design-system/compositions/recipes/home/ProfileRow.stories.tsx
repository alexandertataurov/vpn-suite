import type { Meta, StoryObj } from "@storybook/react";
import { ProfileRow } from "./ProfileRow";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ProfileRow> = {
  title: "Recipes/Home/ProfileRow",
  tags: ["autodocs"],
  component: ProfileRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Home-screen profile row with avatar, account name, plan chip, and settings action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Alex T.",
    initials: "AT",
    status: "active",
    planName: "PRO",
    onSettings: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ProfileRow {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Beta, active, expiring, and expired account states in one row pattern.">
      <StoryShowcase>
        <StoryStack>
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
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
