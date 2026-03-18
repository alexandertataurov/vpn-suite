import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./PageHeader";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PageHeader> = {
  title: "Recipes/PageHeader",
  tags: ["autodocs"],
  component: PageHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Page header for secondary pages (Settings, Plan, Restore Access, Support). Back button + title block + optional action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Settings",
    subtitle: "Manage your account and preferences",
    onBack: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <PageHeader {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="With subtitle and title only.">
      <StoryShowcase>
        <StoryStack>
          <PageHeader
            title="Settings"
            subtitle="Manage your account and preferences"
            onBack={() => {}}
          />
          <PageHeader title="Plan" onBack={() => {}} />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const TitleOnly: Story = {
  args: {
    title: "Plan",
    onBack: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <PageHeader {...args} />
    </StoryShowcase>
  ),
};
