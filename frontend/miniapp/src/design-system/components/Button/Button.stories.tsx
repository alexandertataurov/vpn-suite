import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Button } from ".";
import {
  Inline,
  StorySection,
  StoryShowcase,
  StoryGrid,
  StoryStack,
  StoryComparison,
  StoryPreviewCard,
} from "@/design-system";
import { IconPlus, IconExternalLink, IconSettings } from "@/design-system/icons";

const meta = {
  title: "Components/Button",
  tags: ["autodocs", "contract-test"],
  component: Button,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Primary action control. Variants: primary, secondary, ghost, outline, danger, link, external. Tones (primary only): default, success, warning, danger. Kind: default, connect. Use design tokens for styling.",
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
      options: ["primary", "secondary", "ghost", "outline", "danger", "link", "external"],
    },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    tone: { control: "select", options: ["default", "warning", "danger", "success"] },
    kind: { control: "select", options: ["default", "connect"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Save changes", variant: "primary" },
  render: (args) => (
    <StoryShowcase>
      <div className="story-stack story-stack--center">
        <Button {...args} />
      </div>
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variant hierarchy" description="Use one primary CTA per screen.">
      <StoryShowcase>
        <StoryGrid>
          <Button variant="primary">Save changes</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Delete account</Button>
          <Button variant="link">Learn more</Button>
          <Button variant="external">Open external</Button>
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};

export const PrimaryTones: Story = {
  render: () => (
    <StorySection title="Primary tones" description="Semantic variants for primary buttons.">
      <StoryShowcase>
        <Inline gap="2" wrap>
          <Button variant="primary" tone="default">
            Default
          </Button>
          <Button variant="primary" tone="success">
            Success
          </Button>
          <Button variant="primary" tone="warning">
            Warning
          </Button>
          <Button variant="primary" tone="danger">
            Danger
          </Button>
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ConnectKind: Story = {
  render: () => (
    <StorySection title="Connect button" description="Full-width primary for VPN connect.">
      <StoryShowcase>
        <Button kind="connect">Connect VPN</Button>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StorySection title="Sizes" description="sm, md, lg, and icon-only.">
      <StoryShowcase>
        <Inline gap="2" wrap align="center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" iconOnly aria-label="Settings">
            <IconSettings size={18} strokeWidth={2} aria-hidden />
          </Button>
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Loading, disabled, success, error.">
      <StoryShowcase>
        <StoryStack>
          <div className="story-stack story-stack--tight">
            <span className="story-section__desc">Loading</span>
            <Button loading loadingText="Saving…">
              Save changes
            </Button>
          </div>
          <div className="story-stack story-stack--tight">
            <span className="story-section__desc">Disabled</span>
            <Button disabled>Disabled</Button>
          </div>
          <div className="story-stack story-stack--tight">
            <span className="story-section__desc">Success</span>
            <Button status="success" successText="Saved">
              Save changes
            </Button>
          </div>
          <div className="story-stack story-stack--tight">
            <span className="story-section__desc">Error</span>
            <Button status="error" errorText="Failed">
              Save changes
            </Button>
          </div>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <StorySection title="Icons" description="startIcon, endIcon, iconOnly.">
      <StoryShowcase>
        <StoryStack>
          <Inline gap="2" wrap>
            <Button startIcon={<IconPlus size={16} strokeWidth={2} aria-hidden />}>
              Add device
            </Button>
            <Button
              variant="secondary"
              endIcon={<IconExternalLink size={14} strokeWidth={2} aria-hidden />}
            >
              Open docs
            </Button>
          </Inline>
          <Inline gap="2" wrap align="center">
            <Button size="icon" iconOnly aria-label="Add">
              <IconPlus size={18} strokeWidth={2} aria-hidden />
            </Button>
            <Button size="icon" iconOnly aria-label="Settings">
              <IconSettings size={18} strokeWidth={2} aria-hidden />
            </Button>
          </Inline>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Footer actions in a card.">
      <StoryPreviewCard>
        <div className="story-stack">
          <p className="story-section__desc" style={{ margin: 0 }}>
            Card content goes here.
          </p>
          <Inline gap="2" wrap>
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save changes</Button>
          </Inline>
        </div>
      </StoryPreviewCard>
    </StorySection>
  ),
};

export const Hierarchy: Story = {
  render: () => (
    <StorySection title="Do / Don't" description="One primary vs multiple primary CTAs.">
      <StoryComparison
        leftLabel="Do"
        rightLabel="Don't"
        left={
          <Inline gap="2" wrap>
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save changes</Button>
          </Inline>
        }
        right={
          <Inline gap="2" wrap>
            <Button variant="primary">Save</Button>
            <Button variant="primary">Save & Exit</Button>
          </Inline>
        }
      />
    </StorySection>
  ),
};
