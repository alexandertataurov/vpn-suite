import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";
import { Button } from "../Button";
import {
  StorySection,
  StoryShowcase,
  StoryStack,
} from "@/design-system";
import { ListCard, ListRow } from "@/design-system";
import { IconMonitor } from "@/design-system/icons";

function ThemePane({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="story-theme-pane">
      <p className="story-theme-pane-label">{theme}</p>
      {children}
    </div>
  );
}

function WithThemes({ children }: { children: React.ReactNode }) {
  return (
    <div className="story-themes-row">
      <ThemePane theme="dark">{children}</ThemePane>
      <ThemePane theme="light">{children}</ThemePane>
    </div>
  );
}

const MobileFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="progress-story-mobile-frame">{children}</div>
);

const meta = {
  title: "Components/ProgressBar",
  tags: ["autodocs"],
  component: ProgressBar,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Progress indicator for storage, usage, and device-slot states. Layouts: stacked, inline, and split. Sizes: primary, secondary, and connection.",
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

const thresholdsContent = (
  <StoryStack className="story-stack story-stack--gap-20">
    <ProgressBar value={0} label="Storage used" unit="GB" showValue />
    <ProgressBar value={50} label="Storage used" unit="GB" />
    <ProgressBar
      value={85}
      label="Storage used"
      unit="GB"
      annotation="High usage"
      annotationVariant="warning"
    />
    <ProgressBar
      value={100}
      label="Storage used"
      unit="GB"
      annotation="Limit reached"
      annotationVariant="error"
    />
  </StoryStack>
);

export const Thresholds: Story = {
  name: "Thresholds",
  parameters: {
    docs: {
      description: {
        story:
          "Color changes automatically at >70% (high) and >90% (full). Never set threshold manually — let the component derive it from the value so behaviour is consistent across all screens.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Thresholds"
      description="Color changes automatically at >70% (high) and >90% (full)."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{thresholdsContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const layoutsContent = (
  <StoryStack className="story-stack story-stack--gap-20">
    <ProgressBar value={65} unit="%" label="Devices used" layout="stacked" />
    <ProgressBar value={65} unit="%" label="Devices used" layout="inline" />
    <ProgressBar value={65} unit="%" label="Devices used" layout="split" />
  </StoryStack>
);

export const Layouts: Story = {
  name: "Layouts",
  parameters: {
    docs: {
      description: {
        story:
          "Use stacked when the bar is the primary content of a row. Use inline when showing alongside a label in a single line. Use split when the value must be right-aligned (e.g. in a table).",
      },
    },
  },
  render: () => (
    <StorySection
      title="Layouts"
      description="stacked, inline, split — same data, different presentation."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{layoutsContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const sizesContent = (
  <StoryStack className="story-stack story-stack--gap-20">
    <div>
      <ProgressBar value={65} unit="%" label="Bandwidth" size="primary" />
      <p className="story-section__desc story-section__desc--compact story-text-reset">
        Primary: main stats cards
      </p>
    </div>
    <div>
      <ProgressBar value={65} unit="%" label="Per-device usage" size="secondary" />
      <p className="story-section__desc story-section__desc--compact story-text-reset">
        Secondary: sub-rows
      </p>
    </div>
    <div>
      <ProgressBar value={65} unit="%" label="Inline row indicator" size="connection" />
      <p className="story-section__desc story-section__desc--compact story-text-reset">
        Connection: inline device rows
      </p>
    </div>
  </StoryStack>
);

export const Sizes: Story = {
  name: "Sizes",
  parameters: {
    docs: {
      description: {
        story:
          "Primary (8px) for standalone stats — plan card, billing page. Secondary (5px) for sub-rows and settings panels. Connection (3px) for inline use inside RowItem subtitles — replaces the text subtitle with a compact bar.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Sizes"
      description="primary (8px), secondary (5px), connection (3px)."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{sizesContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

function AnimatedStoryContent() {
  const [key, setKey] = useState(0);
  return (
    <StoryStack className="story-stack story-stack--gap-20">
      <ProgressBar key={key} value={72} unit="GB" label="Data transferred" size="primary" />
      <Button variant="secondary" onClick={() => setKey((k) => k + 1)}>
        Replay
      </Button>
    </StoryStack>
  );
}

export const Animated: Story = {
  name: "Animated fill",
  parameters: {
    docs: {
      description: {
        story: "Bar animates from 0 to value on mount. Click Replay to trigger animation again.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Animated fill"
      description="Bar animates from 0 to value on mount. Click Replay to replay."
    >
      <StoryShowcase>
        <MobileFrame>
          <AnimatedStoryContent />
        </MobileFrame>
      </StoryShowcase>
    </StorySection>
  ),
};

const indeterminateContent = (
  <ProgressBar value={0} indeterminate label="Syncing devices" size="primary" />
);

export const Indeterminate: Story = {
  name: "Indeterminate",
  parameters: {
    docs: {
      description: {
        story: "Used when value is unknown — loading or syncing state.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Indeterminate"
      description="Used when value is unknown — loading or syncing state."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{indeterminateContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ThemeComparison: Story = {
  name: "Theme comparison",
  parameters: {
    docs: {
      description: {
        story: "All threshold states in dark and light simultaneously.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Theme comparison"
      description="All threshold states in dark and light simultaneously."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{thresholdsContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const annotationContent = (
  <StoryStack className="story-stack story-stack--gap-20">
    <ProgressBar
      value={45}
      label="Storage"
      unit="%"
      annotation="Healthy"
      annotationVariant="success"
    />
    <ProgressBar
      value={78}
      label="Storage"
      unit="%"
      annotation="High usage"
      annotationVariant="warning"
    />
    <ProgressBar
      value={100}
      label="Storage"
      unit="%"
      annotation="Limit reached"
      annotationVariant="error"
    />
    <ProgressBar
      value={0}
      label="Storage"
      unit="%"
      annotation="No data"
      annotationVariant="muted"
    />
  </StoryStack>
);

export const AnnotationTheme: Story = {
  name: "Annotation colors",
  parameters: {
    docs: {
      description: {
        story: "Warning and error annotations adapt per theme.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Annotation colors"
      description="Warning and error annotations adapt per theme."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{annotationContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

function SegmentedBar({
  filled,
  total,
  label,
  allFull,
}: {
  filled: number;
  total: number;
  label: string;
  allFull?: boolean;
}) {
  return (
    <div className="pb-wrap pb-wrap--stacked">
      <div className="pb-label-row">
        <span className="pb-label">{label}</span>
      </div>
      <div className="pb-segmented">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={
              i < filled
                ? allFull
                  ? "pb-segment pb-segment--filled pb-segment--full"
                  : "pb-segment pb-segment--filled"
                : "pb-segment pb-segment--empty"
            }
          />
        ))}
      </div>
      <div className="pb-value-row">
        <span className="pb-value">{filled}</span>
        <span className="pb-unit">of {total} slots used</span>
      </div>
    </div>
  );
}

const segmentedThemeContent = (
  <StoryStack className="story-stack story-stack--gap-20">
    <SegmentedBar filled={1} total={5} label="1 of 5 slots used" />
    <SegmentedBar filled={3} total={5} label="3 of 5 slots used" />
    <SegmentedBar filled={5} total={5} label="5 of 5 slots used" allFull />
  </StoryStack>
);

export const Segmented: Story = {
  name: "Segmented",
  parameters: {
    docs: {
      description: {
        story:
          "Use segmented (not a fill bar) when showing discrete slots like device count. Each segment represents one unit — users can count filled vs empty visually without reading the label.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Segmented"
      description="Shows slot usage — e.g. 2 of 5 device slots used."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>
            <SegmentedBar filled={2} total={5} label="Device slots" />
          </MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const SegmentedTheme: Story = {
  name: "Segmented — both themes",
  parameters: {
    docs: {
      description: {
        story: "Device slot indicator in dark and light context.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Segmented — both themes"
      description="Device slot indicator in dark and light context."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{segmentedThemeContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

const inContextContent = (
  <ListCard>
    <ListRow
      icon={<IconMonitor size={18} strokeWidth={2} aria-hidden />}
      title="MacBook Pro"
      subtitle={
        <ProgressBar
          size="connection"
          value={62}
          unit="GB"
          layout="inline"
          showValue
          animate={false}
        />
      }
    />
    <ListRow
      icon={<IconMonitor size={18} strokeWidth={2} aria-hidden />}
      title="iPhone 15"
      subtitle={
        <ProgressBar
          size="connection"
          value={31}
          unit="GB"
          layout="inline"
          showValue
          animate={false}
        />
      }
    />
  </ListCard>
);

export const InContext: Story = {
  name: "In context",
  parameters: {
    viewport: { defaultViewport: "iphone14" },
    docs: {
      description: {
        story: "Progress bar inside a ListRow, as used in device rows.",
      },
    },
  },
  render: () => (
    <StorySection
      title="In context"
      description="Progress bar inside a ListRow, as used in device rows."
    >
      <StoryShowcase>
        <MobileFrame>{inContextContent}</MobileFrame>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContextTheme: Story = {
  name: "In context — both themes",
  parameters: {
    docs: {
      description: {
        story: "Connection size bar inside a RowItem.",
      },
    },
  },
  render: () => (
    <StorySection
      title="In context — both themes"
      description="Connection size bar inside a RowItem."
    >
      <StoryShowcase>
        <WithThemes>
          <MobileFrame>{inContextContent}</MobileFrame>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};
