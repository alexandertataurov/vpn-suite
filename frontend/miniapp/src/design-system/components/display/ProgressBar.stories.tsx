import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/ProgressBar",
  tags: ["autodocs"],
  component: ProgressBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Progress indicator with value, label, thresholds. Layouts: stacked, inline, split. Uses design tokens.",
      },
    },
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    layout: { control: "select", options: ["stacked", "inline", "split"] },
    size: { control: "select", options: ["primary", "secondary", "connection"] },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 65, label: "Usage" },
  render: (args) => (
    <StoryShowcase>
      <ProgressBar {...args} valueLabel="65" valueSuffix="%" />
    </StoryShowcase>
  ),
};

export const Thresholds: Story = {
  render: () => (
    <StorySection title="Thresholds" description="Healthy, high, critical, limit.">
      <StoryShowcase>
        <StoryStack>
          <ProgressBar value={0} label="Empty" valueLabel="0" valueSuffix="GB" />
          <ProgressBar value={50} label="Healthy" valueLabel="50" valueSuffix="GB" />
          <ProgressBar value={85} label="High" valueLabel="85" valueSuffix="GB" />
          <ProgressBar value={100} label="Full" valueLabel="100" valueSuffix="GB" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Layouts: Story = {
  render: () => (
    <StorySection title="Layouts" description="stacked, inline, split.">
      <StoryShowcase>
        <StoryStack>
          <ProgressBar
            value={65}
            label="Stacked"
            layout="stacked"
            valueLabel="65"
            valueSuffix="%"
          />
          <ProgressBar
            value={65}
            label="Inline"
            layout="inline"
            valueLabel="65"
            valueSuffix="%"
          />
          <ProgressBar
            value={65}
            label="Split"
            layout="split"
            valueLabel="65"
            valueSuffix="%"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StorySection title="Sizes" description="primary, secondary, connection.">
      <StoryShowcase>
        <StoryStack>
          <ProgressBar value={65} label="Primary" size="primary" valueLabel="65" valueSuffix="%" />
          <ProgressBar value={65} label="Secondary" size="secondary" valueLabel="65" valueSuffix="%" />
          <ProgressBar value={65} label="Connection" size="connection" valueLabel="65" valueSuffix="%" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Loading: Story = {
  render: () => (
    <StorySection title="Loading" description="Indeterminate state.">
      <StoryShowcase>
        <ProgressBar label="Loading" loading />
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Usage card.">
      <StoryShowcase>
        <div className="story-preview-card">
          <div className="story-stack">
            <span className="story-section__title story-text-reset">
              Data usage
            </span>
            <ProgressBar
              value={72}
              label="This month"
              valueLabel="72"
              valueSuffix="GB"
              size="primary"
            />
          </div>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};
