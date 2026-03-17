import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Button, getButtonClassName } from ".";
import {
  ButtonRow,
  ButtonRowAuto,
  CardFooterLink,
  MissionOperationButton,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryButton,
  MissionSecondaryLink,
} from "@/design-system/compositions/patterns";
import { Inline, Stack } from "@/design-system/core/primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Components/Button",
  tags: ["autodocs"],
  component: Button,
  parameters: {
    docs: {
      description: { component: "Button with variant, size, tone, loading. Use Mission* in patterns for primary/secondary CTAs." },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "outline", "danger", "link"] },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    tone: { control: "select", options: ["default", "warning", "danger"] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Overview of the button system with variants, states, and in-context CTA usage.",
      },
    },
  },
  render: () => (
    <MemoryRouter>
      <StoryPage
        eyebrow="Components"
        title="Buttons"
        summary="The button story now documents the whole button family: base Button variants, mission wrappers, link/anchor usage, paired-action layouts, and footer or operation surfaces."
        stats={[
          { label: "Base variants", value: "6" },
          { label: "Family groups", value: "4" },
          { label: "Contracts", value: "7" },
        ]}
      >
        <StorySection
          title="Base button system"
          description="The base Button owns visual tokens, state behavior, and accessibility contracts. Wrapper components should inherit these rules instead of redefining them."
        >
          <ThreeColumn>
            <StoryCard title="Core variants" caption="Primary + deferral pairs must stay on one line and share the same height.">
              <Stack gap="2">
                <div className="button-story-preview-wide">
                  <ButtonRowAuto>
                    <Button variant="primary" fullWidth style={buttonStoryPairedButtonStyle}>Upgrade now</Button>
                    <Button variant="secondary" style={buttonStoryPairedSecondaryStyle}>Maybe later</Button>
                  </ButtonRowAuto>
                </div>
                <Inline gap="2" wrap>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="link">Link action</Button>
                </Inline>
              </Stack>
            </StoryCard>
            <StoryCard title="Risk handling" caption="Severity is encoded by treatment: outline for reversible destructive, solid amber for urgent, solid red for irreversible destructive.">
              <Stack gap="2">
                <div className="button-story-scale-table">
                  <div className="button-story-scale-row">
                    <strong>Reversible destructive</strong>
                    <span>Outline</span>
                    <span>Red border + red label</span>
                  </div>
                  <div className="button-story-scale-row">
                    <strong>Irreversible destructive</strong>
                    <span>Solid</span>
                    <span>Red fill</span>
                  </div>
                  <div className="button-story-scale-row">
                    <strong>Urgent non-destructive</strong>
                    <span>Solid</span>
                    <span>Amber fill</span>
                  </div>
                </div>
                <Inline gap="2" wrap>
                  <Button variant="danger">Delete config</Button>
                  <Button variant="primary" tone="warning">Renew now</Button>
                  <Button variant="primary" tone="danger">Revoke access</Button>
                </Inline>
              </Stack>
            </StoryCard>
            <StoryCard title="Density and icons" caption="Size jumps are explicit, and icon-only buttons must stay square with an aria-label.">
              <Stack gap="2">
                <div className="button-story-size-grid">
                  <div className="button-story-size-spec"><strong>sm</strong> 32px / 11px / 14px icon</div>
                  <div className="button-story-size-spec"><strong>md</strong> 40px / 13px / 16px icon</div>
                  <div className="button-story-size-spec"><strong>lg</strong> 52px / 15px / 18px icon</div>
                </div>
                <Inline gap="2" wrap>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </Inline>
                <Inline gap="2" wrap>
                  <Button startIcon="←">Back</Button>
                  <Button endIcon="→">Next</Button>
                  <Button size="icon" iconOnly aria-label="Refresh">↺</Button>
                </Inline>
              </Stack>
            </StoryCard>
          </ThreeColumn>
        </StorySection>

        <StorySection
          title="Derived button components"
          description="Mission buttons, mission links, action rows, and footer links are separate components, but they should still read as one system because they are built on the same base contract."
        >
          <ThreeColumn>
            <StoryCard title="Mission buttons" caption="MissionPrimaryButton and MissionSecondaryButton are wrappers for the standard CTA stack used across operational screens.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <MissionPrimaryButton className="mission-story-btn">Connect now</MissionPrimaryButton>
                  <MissionSecondaryButton className="mission-story-btn">Open support</MissionSecondaryButton>
                  <ButtonRowAuto>
                    <MissionPrimaryButton tone="warning" className="mission-story-btn">Renew now</MissionPrimaryButton>
                    <MissionSecondaryButton className="mission-story-btn mission-story-btn--secondary">Maybe later</MissionSecondaryButton>
                  </ButtonRowAuto>
                </Stack>
              </div>
            </StoryCard>
            <StoryCard title="Mission links" caption="Route-based mission links should preserve the same emphasis rules as their button twins.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <MissionPrimaryLink to="/connect">Open connection flow</MissionPrimaryLink>
                  <MissionSecondaryLink to="/support">View support</MissionSecondaryLink>
                </Stack>
              </div>
            </StoryCard>
            <StoryCard title="Action rows and footer links" caption="Operation rows and card-footer links are still part of the button family because they are tappable action surfaces with shared emphasis rules.">
              <Stack gap="2">
                <MissionOperationButton
                  tone="blue"
                  icon="↻"
                  title="Refresh config"
                  description="Generate a new device profile"
                />
                <CardFooterLink onClick={() => undefined}>See all available plans</CardFooterLink>
                <CardFooterLink variant="muted" onClick={() => undefined}>Manage setup logs</CardFooterLink>
                <CardFooterLink variant="destructive" onClick={() => undefined}>Delete account</CardFooterLink>
              </Stack>
            </StoryCard>
          </ThreeColumn>
        </StorySection>

        <StorySection
          title="Operational states"
          description="Loading, hover, disabled, full-width, and linked usage should be demonstrated on the base primitive and on layout helpers that wrap it."
        >
          <TwoColumn>
            <UsageExample title="Connection CTA" description="Loading keeps the same blue identity as Connect, and the spinner + label stay centered as one unit.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <Button kind="connect" fullWidth>Connect</Button>
                  <Button kind="connect" fullWidth loading loadingText="Connecting…">Connect</Button>
                </Stack>
              </div>
            </UsageExample>
            <UsageExample title="Linked actions" description="Anchor-based actions and class-based links should still inherit the same no-wrap and centering rules.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <Button asChild>
                    <a href="#plans">See plans</a>
                  </Button>
                  <a className={`${getButtonClassName("secondary", "md")} button-story-link-button`} href="#settings">
                    Open settings
                  </a>
                </Stack>
              </div>
            </UsageExample>
          </TwoColumn>
        </StorySection>

        <StorySection
          title="Layout helpers"
          description="ButtonRow and ButtonRowAuto are part of the button contract because they control the hierarchy and spacing rules that the buttons depend on."
        >
          <TwoColumn>
            <UsageExample title="Equal emphasis row" description="Use ButtonRow only when two actions truly deserve equal weight and shared width.">
              <ButtonRow>
                <Button variant="danger">Delete config</Button>
                <Button variant="secondary">Cancel</Button>
              </ButtonRow>
            </UsageExample>
            <UsageExample title="Primary plus deferral" description="Use ButtonRowAuto for upgrade or connect flows where the primary action dominates and the secondary action stays lighter.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <ButtonRowAuto>
                    <Button fullWidth>Continue setup</Button>
                    <Button variant="ghost">Not now</Button>
                  </ButtonRowAuto>
                  <ButtonRowAuto>
                    <MissionPrimaryButton className="mission-story-btn">Restore access</MissionPrimaryButton>
                    <MissionSecondaryButton className="mission-story-btn mission-story-btn--secondary">Maybe later</MissionSecondaryButton>
                  </ButtonRowAuto>
                </Stack>
              </div>
            </UsageExample>
          </TwoColumn>
        </StorySection>

        <StorySection
          title="State documentation"
          description="Low-emphasis variants need explicit hover documentation, disabled states rely on opacity only, and full-width centering must hold across button and wrapper usage."
        >
          <ThreeColumn>
            <StoryCard title="Hover states" caption="These previews mirror the documented hover treatment for each base button family.">
              <Stack gap="2">
                <Inline gap="2" wrap>
                  <Button variant="ghost" style={buttonStoryGhostHoverStyle}>Ghost</Button>
                  <Button variant="outline" style={buttonStoryOutlineHoverStyle}>Outline</Button>
                  <Button variant="link" style={buttonStoryLinkHoverStyle}>Link action</Button>
                </Inline>
                <Inline gap="2" wrap>
                  <Button variant="primary" style={buttonStoryPrimaryHoverStyle}>Primary</Button>
                  <Button variant="danger" style={buttonStoryDangerHoverStyle}>Danger solid</Button>
                </Inline>
              </Stack>
            </StoryCard>
            <StoryCard title="Disabled states" caption="Disabled uses opacity only across all variants, including danger actions.">
              <Inline gap="2" wrap>
                <Button disabled>Upgrade now</Button>
                <Button variant="secondary" disabled>Maybe later</Button>
                <Button variant="ghost" disabled>Ghost</Button>
                <Button variant="outline" disabled>Outline</Button>
              </Inline>
            </StoryCard>
            <StoryCard title="Full-width" caption="Primary, outline, and ghost should center their content the same way at 100% width, including loading.">
              <div className="button-story-preview-wide">
                <Stack gap="2">
                  <Button fullWidth>Continue setup</Button>
                  <Button variant="outline" fullWidth>Review config</Button>
                  <Button variant="ghost" fullWidth>Not now</Button>
                  <Button kind="connect" fullWidth loading loadingText="Connecting…">Connect</Button>
                </Stack>
              </div>
            </StoryCard>
          </ThreeColumn>
        </StorySection>
      </StoryPage>
    </MemoryRouter>
  ),
};

export const Primary: Story = {
  args: { children: "Primary", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const AllSizes: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon button" iconOnly>★</Button>
    </Inline>
  ),
};

export const Tones: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button tone="default">Default</Button>
      <Button tone="warning">Warning</Button>
      <Button tone="danger">Danger</Button>
    </Inline>
  ),
};

export const Loading: Story = {
  args: { children: "Loading", loading: true },
};

export const LoadingWithText: Story = {
  args: { children: "Save", loading: true, loadingText: "Saving…" },
};

export const AllVariants: Story = {
  render: () => (
    <Stack gap="2">
      <Inline gap="2" wrap>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link</Button>
      </Inline>
      <Inline gap="2" wrap>
        <Button variant="primary" tone="warning">Primary warning</Button>
        <Button variant="primary" tone="danger">Primary danger</Button>
      </Inline>
    </Stack>
  ),
};

export const Icons: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button startIcon="←">Back</Button>
      <Button endIcon="→">Next</Button>
      <Button iconOnly aria-label="Favorite" variant="ghost">★</Button>
    </Inline>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="button-story-preview-compact">
      <Button fullWidth>Full width action</Button>
    </div>
  ),
};

export const ConnectKind: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button kind="connect">Connect</Button>
      <Button kind="connect" loading loadingText="Connecting…">Connect</Button>
    </Inline>
  ),
};

export const AsChild: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button asChild>
        <a href="#button-link">Anchor as button</a>
      </Button>
      <a className={getButtonClassName("secondary", "md")} href="#button-class">
        getButtonClassName
      </a>
    </Inline>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Button disabled>Disabled</Button>
      <Button variant="secondary" disabled>Disabled secondary</Button>
    </Inline>
  ),
};

export const ButtonFamily: Story = {
  render: () => (
    <MemoryRouter>
      <Stack gap="3">
        <div className="button-story-preview-wide">
          <Stack gap="2">
            <MissionPrimaryButton className="mission-story-btn">Connect now</MissionPrimaryButton>
            <MissionSecondaryButton className="mission-story-btn">Open support</MissionSecondaryButton>
          </Stack>
        </div>
        <ButtonRow>
          <Button variant="danger">Delete config</Button>
          <Button variant="secondary">Cancel</Button>
        </ButtonRow>
        <ButtonRowAuto>
          <Button fullWidth>Upgrade now</Button>
          <Button variant="ghost">Not now</Button>
        </ButtonRowAuto>
        <MissionOperationButton
          tone="blue"
          icon="↻"
          title="Refresh config"
          description="Generate a new device profile"
        />
        <CardFooterLink onClick={() => undefined}>See all available plans</CardFooterLink>
      </Stack>
    </MemoryRouter>
  ),
};

const buttonStoryPairedButtonStyle = {
  ["--btn-height" as const]: "48px",
} as CSSProperties;

const buttonStoryPairedSecondaryStyle = {
  ["--btn-height" as const]: "48px",
  ["--btn-font-size" as const]: "12px",
} as CSSProperties;

const buttonStoryGhostHoverStyle: CSSProperties = {
  background: "var(--control-ghost-hover-bg)",
  color: "var(--color-text)",
};

const buttonStoryOutlineHoverStyle: CSSProperties = {
  background: "var(--control-outline-hover-bg)",
  borderColor: "var(--control-outline-hover-border)",
};

const buttonStoryLinkHoverStyle: CSSProperties = {
  color: "var(--color-text)",
  textDecoration: "underline",
};

const buttonStoryPrimaryHoverStyle: CSSProperties = {
  filter: "brightness(1.08)",
};

const buttonStoryDangerHoverStyle: CSSProperties = {
  filter: "brightness(1.1)",
};
