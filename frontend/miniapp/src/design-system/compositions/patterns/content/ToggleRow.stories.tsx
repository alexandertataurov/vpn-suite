import type { Meta, StoryObj } from "@storybook/react";
import { ToggleRow } from "./ContentForms";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ToggleRow> = {
  title: "Patterns/ToggleRow",
  tags: ["autodocs"],
  component: ToggleRow,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Toggle setting row with name, description, disabled state, and optional disabled reason.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Notifications",
    description: "Receive push notifications",
    checked: true,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Basic enabled toggle row with label and supporting text.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ToggleRow {...args} />
    </StoryShowcase>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="On, off, and disabled states with a reason string.">
      <StoryShowcase>
        <StoryStack>
          <ToggleRow name="Option A" checked={true} onChange={() => {}} />
          <ToggleRow name="Option B" checked={false} onChange={() => {}} />
          <ToggleRow
            name="Option C"
            description="Requires premium"
            checked={false}
            disabled
            disabledReason="Upgrade to enable"
            onChange={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
