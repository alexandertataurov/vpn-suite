import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { PageHeader } from "./PageHeader";
import { SettingsButton, StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PageHeader> = {
  title: "Recipes/Shared/PageHeader",
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
  args: {
    title: "Settings",
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
    <StorySection title="Variants" description="Minimal, descriptive, and action-header states.">
      <StoryShowcase>
        <StoryStack>
          <PageHeader title="Settings" onBack={() => {}} />
          <PageHeader
            title="Plan & Billing"
            subtitle="Manage your plan, renewal, and device access."
            onBack={() => {}}
          />
          <PageHeader
            title="Settings"
            subtitle="Manage plan, billing, support, and account actions."
            onBack={() => {}}
            action={<SettingsButton onClick={() => {}} />}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
