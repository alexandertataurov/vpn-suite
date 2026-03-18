import type { Meta, StoryObj } from "@storybook/react";
import { ProfileRow } from "./ProfileRow";
import { PillChip } from "../patterns";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ProfileRow> = {
  title: "Recipes/ProfileRow",
  tags: ["autodocs"],
  component: ProfileRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Profile row: Avatar + name + PillChip + SettingsButton.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Alex",
    status: <PillChip variant="active">PRO</PillChip>,
    onSettings: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ProfileRow {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Active and expiring status.">
      <StoryShowcase>
        <StoryStack>
          <ProfileRow
            name="Alex"
            status={<PillChip variant="active">PRO</PillChip>}
            onSettings={() => {}}
          />
          <ProfileRow
            name="Alex"
            status={<PillChip variant="expiring">Expiring · 14d</PillChip>}
            onSettings={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Expiring: Story = {
  args: {
    name: "Alex",
    status: <PillChip variant="expiring">Expiring · 14d</PillChip>,
    onSettings: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ProfileRow {...args} />
    </StoryShowcase>
  ),
};
