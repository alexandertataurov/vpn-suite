import type { Meta, StoryObj } from "@storybook/react";
import { RenewalBanner } from "./RenewalBanner";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof RenewalBanner> = {
  title: "Recipes/RenewalBanner",
  tags: ["autodocs"],
  component: RenewalBanner,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Renewal banner per amnezia spec §4.4. Expiring or expired subscription prompt. Uses design tokens.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["expiring", "expired"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "expiring",
    title: "Subscription expires in 14 days",
    subtitle: "Renew now to keep your plan active.",
    onClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <RenewalBanner {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Expiring and expired states.">
      <StoryShowcase>
        <StoryStack>
          <RenewalBanner
            variant="expiring"
            title="Subscription expires in 14 days"
            subtitle="Renew now to keep your plan active."
            onClick={() => {}}
          />
          <RenewalBanner
            variant="expired"
            title="Subscription expired"
            subtitle="Renew to restore access."
            onClick={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Expiring: Story = {
  args: {
    variant: "expiring",
    title: "Subscription expires in 14 days",
    subtitle: "Renew now to keep your plan active.",
    onClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <RenewalBanner {...args} />
    </StoryShowcase>
  ),
};

export const Expired: Story = {
  args: {
    variant: "expired",
    title: "Subscription expired",
    subtitle: "Renew to restore access.",
    onClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <RenewalBanner {...args} />
    </StoryShowcase>
  ),
};
