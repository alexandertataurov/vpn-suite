import type { Meta, StoryObj } from "@storybook/react";
import { Button, InlineAlert, Toast, ToastContainer, ToastViewport, useToast } from "../components";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "./foundations.story-helpers";

const STATIC_TOASTS = [
  { id: "success", variant: "success", message: "Config updated successfully.", duration: 4000, dismissible: false },
  { id: "error", variant: "error", message: "Failed to connect. Try again.", duration: 8000, dismissible: true },
  { id: "info", variant: "info", message: "A new server region is available.", duration: 5000, dismissible: false },
  { id: "persistent", variant: "persistent", message: "Reconnecting to secure tunnel…", duration: 0, dismissible: true },
] as const;

const meta = {
  title: "Primitives/Toast",
  tags: ["autodocs"],
  component: Toast,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
    docs: {
      description: {
        component:
          "Toast is the mobile top-stack feedback pattern for past-event confirmation. It is full-width below the header zone, stacks newest-first, and should not replace in-context alerts for persistent state.",
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Toast"
      summary="Toast is the ephemeral feedback layer for mobile. It renders below the header zone, spans the content width, uses variant-tinted surfaces, and supports auto-dismiss, persistent messages, and a maximum three-item stack."
      stats={[
        { label: "Variants", value: "4" },
        { label: "Stack", value: "max 3" },
        { label: "Position", value: "top" },
      ]}
    >
      <StorySection
        title="Rendered variants"
        description="The visual contract must be visible in Storybook. Render the toast itself, not just the trigger buttons."
      >
        <ThreeColumn>
          <StoryCard title="All variants" caption="Success, error, info, and persistent share the same structure with variant tone and dismiss behavior.">
            <div className="toast-story-static-stack">
              {STATIC_TOASTS.map((toast) => (
                <Toast key={toast.id} {...toast} />
              ))}
            </div>
          </StoryCard>
          <StoryCard title="Top placement" caption="On mobile, toasts sit below the header zone and never compete with the bottom action area.">
            <div className="toast-story-surface">
              <ToastViewport className="toast-story-viewport" toasts={STATIC_TOASTS.slice(0, 3)} />
            </div>
          </StoryCard>
          <StoryCard title="Interaction demo" caption="Use auto-width secondary triggers so labels never truncate in the docs.">
            <ToastContainer>
              <ToastInteractionDemo />
            </ToastContainer>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Mobile contract"
        description="Document the placement, stacking, dismiss, and motion rules so product surfaces do not invent their own toast behavior."
      >
        <TwoColumn>
          <UsageExample title="Stacking and dismissal" description="Newest toasts appear on top. The stack never exceeds three visible items, and persistent or error toasts keep a dismiss control.">
            <div className="toast-story-contract">
              <div className="toast-story-contract-row">
                <strong>Position</strong>
                <span>Fixed below the header zone with 16px horizontal insets. Never bottom-anchored on mobile.</span>
              </div>
              <div className="toast-story-contract-row">
                <strong>Stacking</strong>
                <span>Newest on top, 8px gap, maximum 3 visible. If a toast repeats the same <code>id</code>, update it in place.</span>
              </div>
              <div className="toast-story-contract-row">
                <strong>Dismiss</strong>
                <span>Manual dismiss is optional for success and info, required for error and persistent.</span>
              </div>
              <div className="toast-story-contract-row">
                <strong>Duration</strong>
                <span>Success 4000ms, info 5000ms, error 8000ms, persistent does not auto-dismiss.</span>
              </div>
            </div>
          </UsageExample>
          <UsageExample title="Toast vs inline alert" description="Toast confirms past events. Inline alerts communicate present state that should remain visible until resolved.">
            <Stack gap="3">
              <Toast variant="success" message="Profile saved successfully." duration={4000} />
              <InlineAlert
                variant="warning"
                title="RENEW SOON"
                body="Your subscription expires in 3 days."
              />
            </Stack>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Motion and reduced motion"
        description="Toasts need motion to read as ephemeral, but reduced-motion users should only see a fade without slide or progress animation."
      >
        <TwoColumn>
          <UsageExample title="Motion contract" description="Entry slides down and fades in. Exit slides up and fades out, while the progress bar communicates the remaining auto-dismiss time.">
            <div className="toast-story-static-stack">
              <Toast variant="info" message="A new server region is available." duration={5000} />
              <Toast variant="error" message="Failed to connect. Try again." dismissible duration={8000} className="toast-exit" />
            </div>
          </UsageExample>
          <UsageExample title="Reduced motion" description="Under `prefers-reduced-motion`, toast entry and exit become fade-only and the progress indicator stays static.">
            <div className="toast-story-contract">
              <div className="toast-story-contract-row">
                <strong>Entry</strong>
                <span>220ms spring-like slide-and-fade, or 150ms fade-only when motion is reduced.</span>
              </div>
              <div className="toast-story-contract-row">
                <strong>Exit</strong>
                <span>180ms slide-up fade, or 120ms fade-only under reduced motion.</span>
              </div>
              <div className="toast-story-contract-row">
                <strong>Progress</strong>
                <span>Bottom bar animates for auto-dismissed toasts and pauses on hover or focus. Persistent toasts omit the bar.</span>
              </div>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const AllVariants: Story = {
  parameters: { chromatic: { viewports: [390] } },
  render: () => (
    <div className="toast-story-static-stack">
      {STATIC_TOASTS.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  ),
};

export const MobileTopStack: Story = {
  parameters: { chromatic: { viewports: [390, 375] } },
  render: () => (
    <div className="toast-story-surface">
      <ToastViewport className="toast-story-viewport" toasts={STATIC_TOASTS.slice(0, 3)} />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <ToastContainer>
      <ToastInteractionDemo />
    </ToastContainer>
  ),
};

function ToastInteractionDemo() {
  const { addToast } = useToast();

  return (
    <div className="toast-story-frame">
      <div className="toast-story-trigger-row">
        <Button className="toast-story-trigger-primary" onClick={() => addToast({ message: "Connection restored", variant: "success" })}>
          Success
        </Button>
        <Button className="toast-story-trigger-secondary" variant="danger" onClick={() => addToast({ message: "Unable to reach server", variant: "error" })}>
          Error
        </Button>
        <Button className="toast-story-trigger-secondary" variant="secondary" onClick={() => addToast({ message: "New plan available", variant: "info" })}>
          Info
        </Button>
        <Button className="toast-story-trigger-secondary" variant="ghost" onClick={() => addToast({ id: "persistent-reconnect", message: "Reconnecting to secure tunnel…", variant: "persistent" })}>
          Persistent
        </Button>
      </div>
      <div className="toast-story-contract">
        <div className="toast-story-contract-row">
          <strong>Use toast</strong>
          <span>Past-event confirmation, background-operation errors, and short-lived success feedback.</span>
        </div>
        <div className="toast-story-contract-row">
          <strong>Use alert</strong>
          <span>Ongoing state awareness such as expiring plans, invalid configs, or anything that should persist until resolved.</span>
        </div>
      </div>
    </div>
  );
}
