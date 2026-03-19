import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { SetupCardContent } from "./SetupCardContent";

const meta: Meta<typeof SetupCardContent> = {
  title: "Recipes/Devices/SetupCardContent",
  tags: ["autodocs"],
  component: SetupCardContent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Devices setup card used for no-subscription, issue-device, and pending-confirmation states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    step: "issue",
    canAddDevice: true,
    issueActionLabel: "Add device",
    onIssueDevice: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <SetupCardContent {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Subscription required, ready to add a device, and awaiting connection confirmation.">
      <StoryShowcase>
        <StoryStack>
          <SetupCardContent step="subscription" />
          <SetupCardContent
            step="issue"
            canAddDevice
            issueActionLabel="Add device"
            onIssueDevice={() => {}}
          />
          <SetupCardContent step="pending" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
