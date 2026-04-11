import type { Meta, StoryObj } from "@storybook/react";
import { OfflineBanner } from "@/design-system/patterns";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof OfflineBanner> = {
  title: "Patterns/OfflineBanner",
  tags: ["autodocs"],
  component: OfflineBanner,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Fixed top banner when offline. Auto-hides when connectivity returns; use `visible` to force it on in Storybook.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    message: "YOU ARE OFFLINE.",
    hint: "Actions will resume when connection is restored.",
  },
  render: (args) => (
    <StorySection title="Visible" description="Force the banner on for design review.">
      <StoryShowcase>
        <OfflineBanner {...args} />
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Forced-visible connectivity warning for the top edge of the screen. Use it to verify banner copy, spacing, and fixed positioning while offline.",
      },
    },
  },
};
