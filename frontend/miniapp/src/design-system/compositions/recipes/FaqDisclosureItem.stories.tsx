import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FaqDisclosureItem } from "./FaqDisclosureItem";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof FaqDisclosureItem> = {
  title: "Recipes/FaqDisclosureItem",
  tags: ["autodocs"],
  component: FaqDisclosureItem,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "FAQ accordion item. Expandable title + body.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "How do I restore access?",
    body: "Use the Restore access page and follow the steps. You'll need your email and payment info.",
    isOpen: false,
    onToggle: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ul className="support-faq-list">
        <FaqDisclosureItem {...args} />
      </ul>
    </StoryShowcase>
  ),
};

function InteractiveFaq() {
  const [open, setOpen] = useState(false);
  return (
    <FaqDisclosureItem
      title="How do I restore access?"
      body="Use the Restore access page and follow the steps."
      isOpen={open}
      onToggle={() => setOpen(!open)}
    />
  );
}

export const Interactive: Story = {
  render: () => (
    <StorySection title="Interactive" description="Click to expand/collapse.">
      <StoryShowcase>
        <ul className="support-faq-list">
          <InteractiveFaq />
        </ul>
      </StoryShowcase>
    </StorySection>
  ),
};
