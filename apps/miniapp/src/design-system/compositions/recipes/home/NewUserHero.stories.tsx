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
          "New-user hero used when the user has not bought a plan yet. Centered card layout with primary and secondary actions that balance into a button row when both are present.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Entry hero for users without a plan. Confirm that the primary plan-selection CTA is dominant and the secondary action stays visually paired instead of feeling detached.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <NewUserHero {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "Dual-action and single-action hero states for the no-plan entry flow. Use this to confirm the hero can scale down without losing CTA balance.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Dual-action and single-action hero states for the no-plan entry flow.">
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
