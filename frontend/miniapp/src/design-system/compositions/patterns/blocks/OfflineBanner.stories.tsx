import type { Meta, StoryObj } from "@storybook/react";
import { OfflineBanner } from "./OfflineBanner";
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
          "Fixed top banner when offline. Auto-hides when connectivity returns. Use visible to force show in Storybook.",
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
    <StorySection title="Visible" description="Force visible for design review.">
      <StoryShowcase>
        <OfflineBanner {...args} />
      </StoryShowcase>
    </StorySection>
  ),
};
