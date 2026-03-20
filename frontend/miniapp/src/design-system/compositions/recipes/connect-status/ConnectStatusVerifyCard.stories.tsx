import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { ConnectStatusVerifyCard } from "./ConnectStatusVerifyCard";

const meta: Meta<typeof ConnectStatusVerifyCard> = {
  title: "Recipes/ConnectStatus/ConnectStatusVerifyCard",
  tags: ["autodocs"],
  component: ConnectStatusVerifyCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Verification card contract for pending confirmation, route follow-up, and app-open follow-up states on the connect-status route.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showConfirmAction: true,
    isConfirming: false,
    primaryAction: null,
    onConfirm: () => {},
    onOpenApp: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pending verification state with a confirm action. Use this to check the primary action, loading, and follow-up copy.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ConnectStatusVerifyCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Pending confirm, route follow-up, and open-app follow-up."
    >
      <StoryShowcase>
        <StoryStack>
          <ConnectStatusVerifyCard
            showConfirmAction
            isConfirming={false}
            primaryAction={null}
            onConfirm={() => {}}
            onOpenApp={() => {}}
          />
          <ConnectStatusVerifyCard
            showConfirmAction={false}
            isConfirming={false}
            primaryAction={{ kind: "route", label: "Manage devices", to: "/devices" }}
            onConfirm={() => {}}
            onOpenApp={() => {}}
          />
          <ConnectStatusVerifyCard
            showConfirmAction={false}
            isConfirming={false}
            primaryAction={{ kind: "open_app", label: "Open app again", payload: "amneziavpn://open" }}
            onConfirm={() => {}}
            onOpenApp={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
