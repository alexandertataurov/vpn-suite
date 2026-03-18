import type { Meta, StoryObj } from "@storybook/react";
import { HelperNote } from "./HelperNote";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof HelperNote> = {
  title: "Recipes/Shared/HelperNote",
  tags: ["autodocs"],
  component: HelperNote,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Helper note with optional title. Tones: default, info, warning, danger.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Tip",
    children: "Use the Restore access page if you lost your config.",
    tone: "default",
  },
  render: (args) => (
    <StoryShowcase>
      <HelperNote {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All tones.">
      <StoryShowcase>
        <StoryStack>
          <HelperNote tone="default">Default helper text.</HelperNote>
          <HelperNote title="Info" tone="info">Informational note.</HelperNote>
          <HelperNote title="Warning" tone="warning">Warning message.</HelperNote>
          <HelperNote title="Danger" tone="danger">Critical notice.</HelperNote>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
