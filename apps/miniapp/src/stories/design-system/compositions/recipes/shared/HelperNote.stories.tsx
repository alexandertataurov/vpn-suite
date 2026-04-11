import type { Meta, StoryObj } from "@storybook/react";
import { HelperNote } from "@/design-system/recipes";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof HelperNote> = {
  title: "Recipes/Shared/HelperNote",
  tags: ["autodocs"],
  component: HelperNote,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Helper note with optional title. Tones: default, info, warning, danger.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Tip",
    children: "Use Restore access if the app says your entitlement expired or the config stopped working.",
    tone: "default",
  },
  parameters: {
    docs: {
      description: {
        story: "Default helper note for subtle guidance and inline context.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <HelperNote {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All tones across guidance and warning levels.">
      <StoryShowcase>
        <StoryStack>
          <HelperNote tone="default">Default helper text with a short sentence that still wraps cleanly on mobile.</HelperNote>
          <HelperNote title="Info" tone="info">Informational note with enough body copy to verify line spacing and reading rhythm.</HelperNote>
          <HelperNote title="Warning" tone="warning">Warning message that stays readable when it spans multiple lines in a narrow column.</HelperNote>
          <HelperNote title="Danger" tone="danger">Critical notice with a stronger tone and the same typographic hierarchy.</HelperNote>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Readability: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Long-form guidance copy used where the note sits under a page section or action block. Check that the title and body remain easy to scan without looking oversized.",
      },
    },
  },
  render: () => (
    <StorySection title="Readability" description="Long-form guidance with a title and wrapped body copy.">
      <StoryShowcase>
        <HelperNote title="Before you continue" tone="info">
          Make sure the current plan, device, or support step is the one the user actually needs.
          If the action is destructive, say so in plain language and keep the explanation short.
        </HelperNote>
      </StoryShowcase>
    </StorySection>
  ),
};
