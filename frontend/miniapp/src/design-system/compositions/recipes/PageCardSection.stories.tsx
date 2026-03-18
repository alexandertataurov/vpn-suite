import type { Meta, StoryObj } from "@storybook/react";
import { PageCardSection } from "./PageCardSection";
import { Text } from "@/design-system/core/primitives";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof PageCardSection> = {
  title: "Recipes/PageCardSection",
  tags: ["autodocs"],
  component: PageCardSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Page section with MissionCard. Title, description, action, card tone.",
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
  render: (args) => (
    <StoryShowcase>
      <PageCardSection {...args} />
    </StoryShowcase>
  ),
};
