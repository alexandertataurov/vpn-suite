import type { Meta, StoryObj } from "@storybook/react";
import { PageCardSection } from "./PageCardSection";
import { Text } from "@/design-system/core/primitives";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof PageCardSection> = {
  title: "Recipes/Shared/PageCardSection",
  tags: ["autodocs"],
  component: PageCardSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Page section with a mission-style card. Title, description, action, and card tone are all part of the contract.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Section title",
    description: "Optional description",
    cardTone: "blue",
    children: <Text as="p">Card content goes here.</Text>,
  },
  parameters: {
    docs: {
      description: {
        story: "Generic page-card section wrapper with text content and a single tone.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PageCardSection {...args} />
    </StoryShowcase>
  ),
};
