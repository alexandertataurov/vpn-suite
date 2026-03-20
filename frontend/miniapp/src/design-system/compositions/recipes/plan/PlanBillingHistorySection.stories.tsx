import type { Meta, StoryObj } from "@storybook/react";
import { PlanBillingHistorySection } from "./PlanBillingHistorySection";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanBillingHistorySection> = {
  title: "Recipes/Plan/PlanBillingHistorySection",
  tags: ["autodocs"],
  component: PlanBillingHistorySection,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Billing-history section used on the plan page, including empty, loading, and expandable states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  {
    id: "1",
    title: "Pro Annual",
    subtitle: "Mar 10, 2026",
    amount: "$48.00",
  },
  {
    id: "2",
    title: "Pro Monthly",
    subtitle: "Feb 10, 2026",
    amount: "$5.00",
  },
  {
    id: "3",
    title: "Pro Monthly",
    subtitle: "Jan 10, 2026",
    amount: "$5.00",
  },
  {
    id: "4",
    title: "Starter Monthly",
    subtitle: "Dec 10, 2025",
    amount: "$3.00",
  },
];

export const Default: Story = {
  args: {
    items: items.slice(0, 3),
    loading: false,
    error: false,
    expanded: false,
    canExpand: true,
    onToggleExpanded: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <PlanBillingHistorySection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Collapsed, expanded, loading, and empty billing-history states in one matrix.">
      <StoryShowcase>
        <StoryStack>
          <PlanBillingHistorySection
            items={items.slice(0, 3)}
            loading={false}
            error={false}
            expanded={false}
            canExpand
            onToggleExpanded={() => {}}
          />
          <PlanBillingHistorySection
            items={items}
            loading={false}
            error={false}
            expanded
            canExpand
            onToggleExpanded={() => {}}
          />
          <PlanBillingHistorySection
            items={[]}
            loading
            error={false}
            expanded={false}
            canExpand={false}
            onToggleExpanded={() => {}}
          />
          <PlanBillingHistorySection
            items={[]}
            loading={false}
            error={false}
            expanded={false}
            canExpand={false}
            onToggleExpanded={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
