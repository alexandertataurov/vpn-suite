import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import { Button, ButtonGroup as ButtonGroupComponent } from ".";
import {
  StorySection,
  StoryShowcase,
  StoryStack,
} from "@/design-system";
import { IconExternalLink, IconArrowRight } from "@/design-system/icons";

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

const meta = {
  title: "Components/Button",
  tags: ["autodocs", "contract-test"],
  component: Button,
  args: {
    variant: "primary",
    size: "md",
    children: "Save changes",
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Primary action control for the miniapp. Variants: primary, secondary, danger, external. Tones apply to primary buttons only: default, success, warning, danger.",
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
  argTypes: {
    children: { control: "text", table: { category: "Content" } },
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "external"],
      table: { category: "Appearance" },
    },
    size: { control: "select", options: ["sm", "md"], table: { category: "Appearance" } },
    tone: { control: "select", options: ["default", "success", "warning", "danger"], table: { category: "Appearance" } },
    loading: { control: "boolean", table: { category: "State" } },
    fullWidth: { control: "boolean", table: { category: "Layout" } },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Single primary button with default sizing. Use this as the baseline contract for standalone CTAs.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline standalone button contract for primary actions.">
      <StoryShowcase>
        <Button {...args} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const VariantHierarchy: Story = {
  name: "Variant hierarchy",
  parameters: {
    docs: {
      description: {
        story:
          "Primary, secondary, danger, and external buttons stacked by emphasis. This is the clearest reference for CTA hierarchy.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Variant hierarchy"
      description="Use one primary CTA per screen."
    >
      <StoryShowcase>
        <WithThemes>
          <div className="layout-story-column layout-story-column--medium">
            <Button variant="primary" fullWidth>
              Save changes
            </Button>
            <Button variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button variant="danger" fullWidth>
              Delete account
            </Button>
            <Button
              variant="external"
              fullWidth
              iconRight={<IconExternalLink size={14} strokeWidth={2} aria-hidden />}
            >
              Open in Telegram
            </Button>
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: {
    docs: {
      description: {
        story:
          "Primary button tones in dark and light themes. Use this to verify the token-driven tint mapping rather than the control itself.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Primary tones"
      description="Semantic tones for primary buttons. All use tinted backgrounds."
    >
      <StoryShowcase>
        <WithThemes>
          <div className="layout-story-column layout-story-column--narrow">
            <Button variant="primary" tone="default" fullWidth>
              Save changes
            </Button>
            <Button variant="primary" tone="success" fullWidth>
              Changes saved
            </Button>
            <Button variant="primary" tone="warning" fullWidth>
              Renew plan
            </Button>
            <Button variant="primary" tone="danger" fullWidth>
              Delete account
            </Button>
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: {
    docs: {
      description: {
        story:
          "Medium and small buttons shown side by side. This is the quick sizing reference for dense toolbars and compact forms.",
      },
    },
  },
  render: () => (
    <StorySection title="Sizes">
      <StoryShowcase>
        <div className="layout-story-inline layout-story-inline--center">
          <Button variant="primary" size="md">
            Primary md
          </Button>
          <Button variant="primary" size="sm">
            Primary sm
          </Button>
          <Button variant="secondary" size="md">
            Secondary md
          </Button>
          <Button variant="secondary" size="sm">
            Secondary sm
          </Button>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithIcons: Story = {
  name: "Icons",
  parameters: {
    docs: {
      description: {
        story:
          "Label-only, icon-leading, and icon-trailing combinations. The icon should support the label, not replace it.",
      },
    },
  },
  render: () => (
    <StorySection title="Icon combinations">
      <StoryShowcase>
        <div className="layout-story-inline">
          <Button variant="primary">Label only</Button>
          <Button
            variant="primary"
            iconLeft={<IconArrowRight size={14} strokeWidth={2} aria-hidden />}
          >
            iconLeft + label
          </Button>
          <Button
            variant="primary"
            iconRight={<IconArrowRight size={14} strokeWidth={2} aria-hidden />}
          >
            label + iconRight
          </Button>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ButtonGroup: Story = {
  name: "Button group",
  parameters: {
    docs: {
      description: {
        story:
          "Primary button stacked above secondary button. This is the standard confirmation pattern for the app.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Button group"
      description="Primary stacked above secondary. Standard pattern in the app."
    >
      <StoryShowcase>
        <WithThemes>
          <div className="layout-story-column layout-story-column--medium">
            <Button variant="primary" fullWidth>
              Choose a Plan →
            </Button>
            <Button variant="secondary" fullWidth>
              View setup guide
            </Button>
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  name: "States",
  parameters: {
    docs: {
      description: {
        story:
          "Loading, disabled, success, and error states for the button primitive. Use it to confirm the interaction ladder stays legible.",
      },
    },
  },
  render: function StatesStory() {
    const [successState, setSuccessState] = useState<"idle" | "success">("idle");
    const [errorState, setErrorState] = useState<"idle" | "error">("idle");
    useEffect(() => {
      if (successState === "success") {
        const t = setTimeout(() => setSuccessState("idle"), 1500);
        return () => clearTimeout(t);
      }
    }, [successState]);
    useEffect(() => {
      if (errorState === "error") {
        const t = setTimeout(() => setErrorState("idle"), 2000);
        return () => clearTimeout(t);
      }
    }, [errorState]);
    return (
      <StorySection
        title="States"
        description="Loading, disabled, active, success, error."
      >
        <StoryShowcase>
          <WithThemes>
            <StoryStack>
              <div className="story-stack story-stack--tight">
                <span className="story-label">Loading</span>
                <Button loading loadingText="Saving...">
                  Save changes
                </Button>
              </div>
              <div className="story-stack story-stack--tight">
                <span className="story-label">Disabled</span>
                <Button disabled>
                  Save changes
                </Button>
              </div>
              <div className="story-stack story-stack--tight">
                <span className="story-label">Active</span>
                <Button variant="primary">Press to see active state</Button>
              </div>
              <div className="story-stack story-stack--tight">
                <span className="story-label">Success</span>
                <Button
                  variant="primary"
                  transientState={successState}
                  onClick={() => setSuccessState("success")}
                >
                  Save changes
                </Button>
              </div>
              <div className="story-stack story-stack--tight">
                <span className="story-label">Error</span>
                <Button
                  variant="primary"
                  transientState={errorState}
                  onClick={() => setErrorState("error")}
                >
                  Save changes
                </Button>
              </div>
            </StoryStack>
          </WithThemes>
        </StoryShowcase>
      </StorySection>
    );
  },
};

export const ResponsiveGroup: Story = {
  name: "Responsive group",
  parameters: {
    docs: {
      description: {
        story:
          "Stacks vertically on mobile, horizontal on tablet+. Resize the canvas to see the layout shift.",
      },
    },
    viewport: { defaultViewport: "iphone14" },
  },
  render: () => (
    <StorySection
      title="Responsive group"
      description="Stacks vertically on mobile, horizontal on tablet+. Resize the canvas to see the layout shift."
    >
      <StoryShowcase>
        <ButtonGroupComponent>
          <Button variant="primary" fullWidth>
            Save changes
          </Button>
          <Button variant="secondary" fullWidth>
            Cancel
          </Button>
        </ButtonGroupComponent>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ThemeComparison: Story = {
  name: "Theme comparison",
  parameters: {
    docs: {
      description: {
        story:
          "All button variants rendered in both themes at once. This is the fastest way to compare token behavior across contexts.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Theme comparison"
      description="All variants in dark and light contexts simultaneously."
    >
      <StoryShowcase>
        <WithThemes>
          <div className="layout-story-column layout-story-column--narrow">
            <Button variant="primary" fullWidth>
              Primary
            </Button>
            <Button variant="secondary" fullWidth>
              Secondary
            </Button>
            <Button variant="danger" fullWidth>
              Danger
            </Button>
            <Button variant="external" fullWidth>
              External
            </Button>
            <Button variant="primary" tone="success" fullWidth>
              Success
            </Button>
            <Button variant="primary" tone="warning" fullWidth>
              Warning
            </Button>
            <Button variant="primary" tone="danger" fullWidth>
              Danger tone
            </Button>
          </div>
        </WithThemes>
      </StoryShowcase>
    </StorySection>
  ),
};
