import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { VpnBoundaryNote } from "./VpnBoundaryNote";

const meta: Meta<typeof VpnBoundaryNote> = {
  title: "Recipes/Shared/VpnBoundaryNote",
  tags: ["autodocs"],
  component: VpnBoundaryNote,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Canonical helper note for VPN-specific boundaries, setup hints, and warning states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    messageKey: "common.vpn_boundary_note",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default boundary note used for user-facing setup constraints and VPN-specific caveats.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <VpnBoundaryNote {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Default helper note and warning-state setup note."
    >
      <StoryShowcase>
        <StoryStack>
          <VpnBoundaryNote messageKey="common.vpn_boundary_note" />
          <VpnBoundaryNote tone="warning" messageKey="devices.config_preparing_message" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
