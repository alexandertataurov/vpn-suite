import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { AccountCancellationModal } from "./AccountCancellationModal";

const meta: Meta<typeof AccountCancellationModal> = {
  title: "Recipes/Settings/AccountCancellationModal",
  tags: ["autodocs"],
  component: AccountCancellationModal,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Final account deletion confirmation flow used from Settings.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onConfirm: async () => {},
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Destructive confirmation dialog in the idle state, with cancel and confirm actions visible.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <AccountCancellationModal {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Idle and loading confirmation states.">
      <StoryShowcase>
        <StoryStack>
          <AccountCancellationModal
            isOpen
            onClose={() => {}}
            onConfirm={async () => {}}
          />
          <AccountCancellationModal
            isOpen
            onClose={() => {}}
            onConfirm={async () => {}}
            loading
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
