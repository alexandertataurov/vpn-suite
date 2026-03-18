import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { PageHeader } from "./PageHeader";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof PageHeader> = {
  title: "Recipes/PageHeader",
  tags: ["autodocs"],
  component: PageHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inner page header with back button, title, subtitle, and optional right action.",
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

export const Default: Story = {
  render: () => (
    <StoryShowcase>
      <PageHeader title="Settings" onBack={() => {}} />
    </StoryShowcase>
  ),
};
