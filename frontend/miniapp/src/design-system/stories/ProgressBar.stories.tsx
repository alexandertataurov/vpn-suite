import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, ProgressBar } from "../components";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Components/ProgressBar",
  tags: ["autodocs"],
  component: ProgressBar,
  parameters: {
    docs: {
      description: {
        component: "Progress bar with mobile-first sizing, threshold colors, layout variants, indeterminate loading, and animated value updates.",
      },
    },
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Progress bar"
      summary="ProgressBar is a mobile-first usage indicator. It supports primary and secondary thickness, automatic threshold colors, multiple label layouts, loading state, and value transitions."
      stats={[
        { label: "Layouts", value: "3" },
        { label: "Thresholds", value: "4" },
        { label: "Mobile width", value: "390px" },
      ]}
    >
      <StorySection
        title="Progress states"
        description="Primary usage bars use a 6px track, while secondary and transient progress use 4px. Threshold color changes are automatic from the current percentage."
      >
        <ThreeColumn>
          <StoryCard title="Primary usage" caption="Primary consumption metrics use the thicker 6px bar for mobile legibility.">
            <ProgressBar
              value={42}
              max={100}
              label="Bandwidth used"
              valueLabel="42%"
              valueSuffix="of monthly quota"
              size="primary"
            />
          </StoryCard>
          <StoryCard title="Boundary values" caption="Full usage switches to the urgent red treatment and appends a limit suffix.">
            <Stack gap="3">
              <ProgressBar value={0} label="Bandwidth used" valueLabel="0%" valueSuffix="of monthly quota" />
              <ProgressBar value={100} label="Bandwidth used" valueLabel="100%" valueSuffix="of monthly quota" />
            </Stack>
          </StoryCard>
          <StoryCard title="Custom max" caption="Use raw values with arbitrary maxima and let the component derive thresholds internally.">
            <ProgressBar
              value={256}
              max={512}
              label="Bandwidth used"
              valueLabel="50%"
              valueSuffix="of monthly quota"
            />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Threshold states"
        description="Threshold colors communicate healthy, high, critical, and exhausted usage without forcing the caller to pick tones manually."
      >
        <UsageExample title="Automatic thresholds" description="Green stays healthy, amber warns, red escalates, and 100% adds a limit state.">
          <div className="progress-story-mobile-frame">
            <Stack gap="4">
              <ProgressBar value={42} label="Bandwidth used" valueLabel="42%" valueSuffix="of monthly quota" />
              <ProgressBar value={78} label="Bandwidth used" valueLabel="78%" valueSuffix="of monthly quota" />
              <ProgressBar value={92} label="Bandwidth used" valueLabel="92%" valueSuffix="of monthly quota" />
              <ProgressBar value={100} label="Bandwidth used" valueLabel="100%" valueSuffix="of monthly quota" />
            </Stack>
          </div>
        </UsageExample>
      </StorySection>

      <StorySection
        title="Layout variants"
        description="Some contexts need a stacked value, some need the value inline with the label, and some need a split header above the bar."
      >
        <ThreeColumn>
          <StoryCard title="Stacked" caption="Default label above, value below. Best for plan and billing cards.">
            <ProgressBar
              value={42}
              label="Bandwidth used"
              valueLabel="42%"
              valueSuffix="of monthly quota"
              layout="stacked"
            />
          </StoryCard>
          <StoryCard title="Inline" caption="Label and value share the same row with a tighter inline grouping.">
            <ProgressBar
              value={42}
              label="Bandwidth used"
              valueLabel="42%"
              valueSuffix="of monthly quota"
              layout="inline"
            />
          </StoryCard>
          <StoryCard title="Split" caption="Label left, value right. Useful for denser cards or server metrics.">
            <ProgressBar
              value={42}
              label="Bandwidth used"
              valueLabel="42%"
              valueSuffix=""
              layout="split"
            />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Loading and animation"
        description="Loading should be visibly indeterminate rather than looking like 0%, and value updates should animate smoothly after initial render."
      >
        <ThreeColumn>
          <StoryCard title="Loading" caption="Indeterminate state uses a muted animated fill.">
            <ProgressBar loading label="Bandwidth used" valueSuffix="Fetching latest usage" />
          </StoryCard>
          <StoryCard title="Secondary metric" caption="Secondary or inline progress stays at 4px so it does not dominate.">
            <ProgressBar
              value={55}
              label="Connection progress"
              valueLabel="55%"
              layout="split"
              size="connection"
            />
          </StoryCard>
          <StoryCard title="Animated update" caption="Value changes animate width and threshold color instead of jumping.">
            <AnimatedProgressDemo />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="The plan consumption pattern should be rendered at real mobile width so the bar length matches what users actually see on a phone."
      >
        <UsageExample title="Plan consumption" description="This is the canonical mobile-width usage card render.">
          <div className="progress-story-mobile-frame">
            <ProgressBar
              value={42}
              label="Bandwidth used"
              valueLabel="42%"
              valueSuffix="of monthly quota"
              size="primary"
            />
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

export const Default: Story = {
  args: { value: 60, label: "Usage" },
};

export const Empty: Story = {
  args: { value: 0, label: "Usage" },
};

export const Full: Story = {
  args: { value: 100, label: "Usage" },
};

export const WithMax: Story = {
  args: { value: 256, max: 512, label: "Bandwidth", valueLabel: "50%", valueSuffix: "of monthly quota" },
};

export const ThresholdStates: Story = {
  render: () => (
    <div className="progress-story-mobile-frame">
      <Stack gap="4">
        <ProgressBar value={42} max={100} label="Bandwidth used" valueLabel="42%" valueSuffix="of monthly quota" />
        <ProgressBar value={78} max={100} label="Bandwidth used" valueLabel="78%" valueSuffix="of monthly quota" />
        <ProgressBar value={92} max={100} label="Bandwidth used" valueLabel="92%" valueSuffix="of monthly quota" />
        <ProgressBar value={100} max={100} label="Bandwidth used" valueLabel="100%" valueSuffix="of monthly quota" />
      </Stack>
    </div>
  ),
  parameters: { chromatic: { viewports: [390] } },
};

export const Loading: Story = {
  render: () => (
    <div className="progress-story-mobile-frame">
      <ProgressBar loading label="Bandwidth used" valueSuffix="Fetching latest usage" />
    </div>
  ),
};

export const AnimatedUpdate: Story = {
  tags: ["!chromatic"],
  render: () => <AnimatedProgressDemo />,
};

function AnimatedProgressDemo() {
  const [value, setValue] = useState(42);

  return (
    <Stack gap="3">
      <ProgressBar
        value={value}
        label="Bandwidth used"
        valueLabel={`${value}%`}
        valueSuffix="of monthly quota"
      />
      <Button size="sm" onClick={() => setValue((current) => Math.min(current + 10, 100))}>
        +10%
      </Button>
    </Stack>
  );
}
