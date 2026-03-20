import type { Meta, StoryObj } from "@storybook/react";
import { IconChevronRight, IconMonitor } from "@/design-system/icons";
import { Badge, ListCard, ListRow } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/ListRow",
  tags: ["autodocs"],
  component: ListRow,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Row item for list cards. Use with ListCard.",
      },
    },
  },
} satisfies Meta<typeof ListRow>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderChevron() {
  return <IconChevronRight size={13} strokeWidth={2.5} />;
}

const manageDevicesRow = {
  icon: <IconMonitor size={15} strokeWidth={2} />,
  iconTone: "neutral" as const,
  title: "Manage Devices",
  subtitle: "2 of 5 devices added",
  right: renderChevron(),
  onClick: () => {},
};

export const Default: Story = {
  args: manageDevicesRow,
  parameters: {
    docs: {
      description: {
        story: "Default management row with icon, subtitle, and chevron affordance.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ListCard className="home-card-row">
        <ListRow {...args} />
      </ListCard>
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Default row, grouped right slot, and danger treatment.">
      <StoryShowcase>
        <ListCard className="home-card-row">
          <ListRow
            {...manageDevicesRow}
          />
          <ListRow
            {...manageDevicesRow}
            subtitle="2 of 5 devices"
            right={
              <div className="home-row-right-group">
                <Badge label="Full" variant="muted" />
                {renderChevron()}
              </div>
            }
          />
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconVariant="danger"
            title="Delete account"
            subtitle="Permanently remove your account"
            right={renderChevron()}
            onClick={() => {}}
          />
        </ListCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Multiple rows inside one ListCard section.">
      <StoryShowcase>
        <ListCard className="home-card-row">
          <ListRow {...manageDevicesRow} subtitle="2 of 5 devices" />
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconTone="neutral"
            title="Settings"
            subtitle="Account and preferences"
            right={renderChevron()}
            onClick={() => {}}
          />
        </ListCard>
      </StoryShowcase>
    </StorySection>
  ),
};
