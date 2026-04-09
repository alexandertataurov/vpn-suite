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
          "Inner-page header with back button, title, subtitle, and optional right action.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Standard inner-page header with only a back action. Use it as the baseline for detail pages that need a compact title bar.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PageHeader {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Minimal, descriptive, and action-header states shown together. Review how the header scales when a right-side action is introduced.",
      },
    },
  },
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

export const LongLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Stress test for long page titles, subtitles, and a right-side action. Use it to verify that the chrome stays readable before the content below it gets dense.",
      },
    },
  },
  render: () => (
    <StorySection title="Long labels" description="Long title, subtitle, and action spacing under tighter layout pressure.">
      <StoryShowcase>
        <PageHeader
          title="Plan, billing, device access, and subscription recovery"
          subtitle="Manage renewal timing, review payment history, and get back online without losing context."
          onBack={() => {}}
          action={<SettingsButton onClick={() => {}} />}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
