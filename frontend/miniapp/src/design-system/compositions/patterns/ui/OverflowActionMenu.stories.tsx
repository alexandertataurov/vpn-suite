import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { OverflowActionMenu } from "./OverflowActionMenu";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof OverflowActionMenu> = {
  title: "Patterns/OverflowActionMenu",
  tags: ["autodocs"],
  component: OverflowActionMenu,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Popover menu with overflow trigger (⋮). Supports navigation, callbacks, destructive items, dividers.",
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

const DEFAULT_ITEMS = [
  { id: "edit", label: "Edit", onSelect: () => {} },
  { id: "share", label: "Share", onSelect: () => {} },
  { id: "delete", label: "Delete", danger: true, onSelect: () => {} },
];

export const Default: Story = {
  args: {
    items: DEFAULT_ITEMS,
  },
  render: (args) => (
    <StoryShowcase>
      <OverflowActionMenu {...args} />
    </StoryShowcase>
  ),
};

export const WithDividers: Story = {
  render: () => (
    <StorySection title="With dividers" description=" dividerBefore for grouping.">
      <StoryShowcase>
        <OverflowActionMenu
          items={[
            { id: "edit", label: "Edit", onSelect: () => {} },
            { id: "share", label: "Share", onSelect: () => {} },
            { id: "delete", label: "Delete", danger: true, dividerBefore: true, onSelect: () => {} },
          ]}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
