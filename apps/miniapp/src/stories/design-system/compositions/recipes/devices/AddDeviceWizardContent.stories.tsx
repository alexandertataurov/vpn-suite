import type { Meta, StoryObj } from "@storybook/react";
import { Button, Input, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { AddDeviceWizardContent } from "@/design-system/recipes";

const meta: Meta<typeof AddDeviceWizardContent> = {
  title: "Recipes/Devices/AddDeviceWizardContent",
  tags: ["autodocs"],
  component: AddDeviceWizardContent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two-step add-device wizard contract used in the Devices modal flow.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const installSteps = [
  "Download AmneziaVPN from the App Store or Google Play.",
  "Create the device configuration in the miniapp.",
  "Import the generated profile into the VPN app.",
  "Connect once, then return to confirm the device.",
];

const links = (
  <>
    <Button variant="outline" size="sm">Download for iPhone</Button>
    <Button variant="outline" size="sm">Download for Android</Button>
  </>
);

export const Default: Story = {
  args: {
    step: "name",
    nameSlot: (
      <Input
        type="text"
        label="Device name"
        description="Choose a name so you can recognize this device later."
        value="Alex's iPhone"
        onChange={() => {}}
      />
    ),
    installKicker: "Install the VPN app",
    installMessage: "Use AmneziaVPN to import and connect your new configuration.",
    installSteps,
    storeLinks: links,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Name-entry step only. Use this to validate the first step contract before the install guidance is shown.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <AddDeviceWizardContent {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Separate name-entry and install-guidance steps in the same canonical wizard contract."
    >
      <StoryShowcase>
        <StoryStack>
          <AddDeviceWizardContent
            step="name"
            nameSlot={(
              <Input
                type="text"
                label="Device name"
                description="Choose a name so you can recognize this device later."
                value="Alex's iPhone"
                onChange={() => {}}
              />
            )}
            installKicker="Install the VPN app"
            installMessage="Use AmneziaVPN to import and connect your new configuration."
            installSteps={installSteps}
            storeLinks={links}
          />
          <AddDeviceWizardContent
            step="install"
            nameSlot={null}
            installKicker="Install the VPN app"
            installMessage="Use AmneziaVPN to import and connect your new configuration."
            installSteps={installSteps}
            storeLinks={links}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
