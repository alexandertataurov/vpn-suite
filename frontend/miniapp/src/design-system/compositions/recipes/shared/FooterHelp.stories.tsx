import type { Meta, StoryObj } from "@storybook/react";
import { FooterHelp } from "./FooterHelp";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof FooterHelp> = {
  title: "Recipes/Shared/FooterHelp",
  tags: ["autodocs"],
  component: FooterHelp,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Footer help block for setup assistance and troubleshooting entry points.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    note: "Having trouble?",
    linkLabel: "View setup guide",
    onLinkClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Footer callout used to direct users into the setup guide from lower page surfaces.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <FooterHelp {...args} />
    </StoryShowcase>
  ),
};
