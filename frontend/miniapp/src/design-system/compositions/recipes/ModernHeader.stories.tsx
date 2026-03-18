import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { ModernHeader } from "./ModernHeader";
import { PillChip } from "../patterns";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ModernHeader> = {
  title: "Recipes/ModernHeader",
  tags: ["autodocs"],
  component: ModernHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Home/inner page header. Profile row or title, optional back button, settings gear.",
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
    displayName: "Alex",
    subtitle: "Pro Monthly",
    pillChip: <PillChip variant="active">PRO</PillChip>,
    showSettings: true,
    onSettingsClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ModernHeader {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Home profile vs inner page title.">
      <StoryShowcase>
        <StoryStack>
          <ModernHeader
            displayName="Alex"
            subtitle="Pro Monthly"
            pillChip={<PillChip variant="active">PRO</PillChip>}
            onSettingsClick={() => {}}
          />
          <ModernHeader
            title="Settings"
            onBack={() => {}}
            showSettings={false}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
