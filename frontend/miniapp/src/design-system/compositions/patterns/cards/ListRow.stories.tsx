import type { Meta, StoryObj } from "@storybook/react";
import { IconChevronRight, IconMonitor } from "@/design-system/icons";
import { Badge, ListCard, ListRow } from "@/design-system";

const meta: Meta<typeof ListRow> = {
  title: "Components/RowItem",
  tags: ["autodocs"],
  component: ListRow,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Row item for list cards. Use with ListCard (CardRow).",
      },
    },
  },
};

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
};

export const WithBadge: Story = {
  render: () => (
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
  ),
};

export const DangerVariant: Story = {
  args: {
    icon: <IconMonitor size={15} strokeWidth={2} />,
    iconVariant: "danger",
    title: "Delete account",
    subtitle: "Permanently remove your account",
    right: <IconChevronRight size={13} strokeWidth={2.5} />,
    onClick: () => {},
  },
};
