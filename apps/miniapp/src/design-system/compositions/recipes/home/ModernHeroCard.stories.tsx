import type { Meta, StoryObj } from "@storybook/react";
import { ModernHeroCard } from "./ModernHeroCard";
import { IconShield } from "@/design-system/icons";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase, StoryGrid } from "@/design-system";

const meta: Meta<typeof ModernHeroCard> = {
  title: "Recipes/Home/ModernHeroCard",
  tags: ["autodocs"],
  component: ModernHeroCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Hero card contract with icon, title, description, and actions. Status: default, active, warning, danger.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <IconShield size={32} strokeWidth={1.75} aria-hidden />,
    title: "Secure connection",
    description: "Your traffic is encrypted with AmneziaWG.",
    status: "active",
    actions: <Button variant="primary">Connect</Button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Connected-state hero with a clear primary action and the default layout used on the home surface.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ModernHeroCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Status states and card emphasis variations.">
      <StoryShowcase>
        <StoryGrid>
          <ModernHeroCard
            icon={<IconShield size={32} strokeWidth={1.75} aria-hidden />}
            title="Default"
            description="Default status"
            status="default"
          />
          <ModernHeroCard
            icon={<IconShield size={32} strokeWidth={1.75} aria-hidden />}
            title="Active"
            description="Connected"
            status="active"
          />
          <ModernHeroCard
            icon={<IconShield size={32} strokeWidth={1.75} aria-hidden />}
            title="Warning"
            description="Expiring soon"
            status="warning"
          />
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};
