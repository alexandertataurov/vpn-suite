import type { Meta, StoryObj } from "@storybook/react";
import { NewUserHero } from "./NewUserHero";
import { Button, StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof NewUserHero> = {
  title: "Recipes/Home/NewUserHero",
  tags: ["autodocs"],
  component: NewUserHero,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "New-user hero per amnezia spec §4.10. Centered card when no plan purchased. Uses design tokens.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Setup Required",
    description: "Choose a plan to start using AmneziaVPN with secure access on your devices.",
    primaryAction: <Button variant="primary">Choose a Plan</Button>,
    secondaryAction: <Button variant="secondary">Learn more</Button>,
  },
  render: (args) => (
    <StoryShowcase>
      <NewUserHero {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  name: "Variants",
  render: () => (
    <StorySection title="Variants" description="Dual-action and single-action new-user hero states.">
      <StoryShowcase>
        <StoryStack>
          <NewUserHero
            title="Setup Required"
            description="Choose a plan to start using AmneziaVPN with secure access on your devices."
            primaryAction={<Button variant="primary">Choose a Plan</Button>}
            secondaryAction={<Button variant="secondary">Learn more</Button>}
          />
          <NewUserHero
            title="Setup Required"
            description="Choose a plan to get started."
            primaryAction={<Button variant="primary">Choose a Plan</Button>}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
