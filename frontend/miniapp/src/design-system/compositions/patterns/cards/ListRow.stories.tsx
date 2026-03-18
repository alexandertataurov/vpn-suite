import type { Meta, StoryObj } from "@storybook/react";
import { IconChevronRight, IconMonitor } from "@/design-system/icons";
import { Badge, ListCard, ListRow } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Components/ListRow",
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

export const Default: Story = {
  args: {
    icon: <IconMonitor size={15} strokeWidth={2} />,
    iconTone: "neutral",
    title: "Manage Devices",
    subtitle: "2 of 5 devices added",
    right: <IconChevronRight size={13} strokeWidth={2.5} />,
    onClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ListCard className="home-card-row">
        <ListRow {...args} />
      </ListCard>
    </StoryShowcase>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <StorySection title="With badge" description="Badge and chevron in right slot.">
      <StoryShowcase>
        <ListCard className="home-card-row">
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconTone="neutral"
            title="Manage Devices"
            subtitle="2 of 5 devices"
            right={
              <div className="home-row-right-group">
                <Badge label="Full" variant="muted" />
                <IconChevronRight size={13} strokeWidth={2.5} />
              </div>
            }
            onClick={() => {}}
          />
        </ListCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const DangerVariant: Story = {
  render: () => (
    <StorySection title="Danger variant" description="Destructive action row.">
      <StoryShowcase>
        <ListCard className="home-card-row">
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconVariant="danger"
            title="Delete account"
            subtitle="Permanently remove your account"
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => {}}
          />
        </ListCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Multiple rows in ListCard.">
      <StoryShowcase>
        <ListCard className="home-card-row">
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconTone="neutral"
            title="Manage Devices"
            subtitle="2 of 5 devices"
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => {}}
          />
          <ListRow
            icon={<IconMonitor size={15} strokeWidth={2} />}
            iconTone="neutral"
            title="Settings"
            subtitle="Account and preferences"
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => {}}
          />
        </ListCard>
      </StoryShowcase>
    </StorySection>
  ),
};
