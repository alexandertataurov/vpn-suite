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
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Primary action control. Variants: primary, secondary, danger, external. Tones (primary only): default, success, warning, danger. Theme-aware via --btn-* tokens.",
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
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "external"],
    },
    size: { control: "select", options: ["sm", "md"] },
    tone: { control: "select", options: ["default", "success", "warning", "danger"] },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Save changes",
  },
  render: (args) => (
    <StoryShowcase>
      <Button {...args} />
    </StoryShowcase>
  ),
};

export const VariantHierarchy: Story = {
  name: "Variant hierarchy",
  parameters: {
    docs: {
      description: {
        story: "Use one primary CTA per screen.",
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
          <div style={{ width: 390, display: "flex", flexDirection: "column", gap: 8 }}>
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
  name: "Primary tones",
  parameters: {
    docs: {
      description: {
        story:
          "Semantic tones for primary buttons. All use tinted backgrounds. Dark theme: Default = near-white, Success = green tint, Warning = amber tint, Danger = red tint. Light theme: Default = near-black, all tones = pale tinted bg. If Default appears blue in either theme, --btn-primary-bg token is not resolving — check [data-theme] selector scope.",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
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
  render: () => (
    <StorySection title="Sizes">
      <StoryShowcase>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
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
  name: "Icon combinations",
  render: () => (
    <StorySection title="Icon combinations">
      <StoryShowcase>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
        story: "Primary stacked above secondary. Standard pattern in the app.",
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
          <div style={{ width: 390, display: "flex", flexDirection: "column", gap: 8 }}>
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
          "Loading, disabled, active, success, error. Active uses :active styles (opacity 0.85, scale 0.99).",
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

export const ThemeComparison: Story = {
  name: "Theme comparison",
  parameters: {
    docs: {
      description: {
        story: "All variants in dark and light contexts simultaneously.",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
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
