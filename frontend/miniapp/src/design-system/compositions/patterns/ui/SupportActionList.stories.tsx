import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { SupportActionList } from "./SupportActionList";
import { IconLock, IconShield, IconHelpCircle } from "@/design-system/icons";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof SupportActionList> = {
  title: "Patterns/SupportActionList",
  tags: ["autodocs"],
  component: SupportActionList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Quick links row for Support page. Restore access, plans, devices. Uses MissionOperationLink.",
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
  {
    to: "/restore-access",
    title: "Restore access",
    description: "Recover your account",
    icon: <IconLock size={20} strokeWidth={1.75} aria-hidden />,
    tone: "blue" as const,
  },
  {
    to: "/plan",
    title: "Plans",
    description: "View and manage subscription",
    icon: <IconShield size={20} strokeWidth={1.75} aria-hidden />,
    tone: "green" as const,
  },
  {
    to: "/support",
    title: "Contact support",
    description: "Get help",
    icon: <IconHelpCircle size={20} strokeWidth={1.75} aria-hidden />,
    tone: "amber" as const,
  },
];

export const Default: Story = {
  args: {
    items: DEFAULT_ITEMS,
  },
  render: (args) => (
    <StoryShowcase>
      <SupportActionList {...args} />
    </StoryShowcase>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <StorySection title="With disabled" description="Disabled item shown as non-clickable.">
      <StoryShowcase>
        <SupportActionList
          items={[
            ...DEFAULT_ITEMS,
            {
              to: "/disabled",
              title: "Coming soon",
              description: "Not available yet",
              icon: <IconHelpCircle size={20} strokeWidth={1.75} aria-hidden />,
              disabled: true,
            },
          ]}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
