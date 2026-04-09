import type { Meta, StoryObj } from "@storybook/react";
import { SectionLabel } from "./SectionLabel";
import { ListCard, ListRow } from "../cards/ListCard";
import { IconMonitor } from "@/design-system/icons";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/SectionLabel",
  tags: ["autodocs"],
  component: SectionLabel,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Section eyebrow label for grouped content, such as YOUR PLAN or DEVICE MANAGEMENT.",
      },
    },
  },
} satisfies Meta<typeof SectionLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "YOUR PLAN" },
  parameters: {
    docs: {
      description: {
        story: "Simple eyebrow label for a section header.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <SectionLabel {...args} />
    </StoryShowcase>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Placed above a list card to separate a section.">
      <StoryShowcase>
        <div className="story-stack">
          <SectionLabel label="DEVICE MANAGEMENT" />
          <ListCard className="home-card-row">
            <ListRow
              icon={<IconMonitor size={15} strokeWidth={2} />}
              iconTone="neutral"
              title="Manage Devices"
              subtitle="2 of 5 devices"
              onClick={() => {}}
            />
          </ListCard>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};
