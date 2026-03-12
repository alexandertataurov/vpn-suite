import type { Meta, StoryObj } from "@storybook/react";
import { Button, InlineAlert } from "../components";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  parameters: {
    docs: {
      description: {
        component: "Inline alert with variant-based tint, left border, title-anchored status dot, and optional aligned action row.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["info", "warning", "error", "success"] },
  },
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Inline alert"
      summary="Inline alerts are mobile-first status blocks. The dot, title, body, and optional actions all align to one grid so alerts stay consistent across passive, warning, error, and actionable states."
      stats={[
        { label: "Variants", value: "4" },
        { label: "Actions", value: "optional" },
        { label: "Mobile story", value: "full-width" },
      ]}
    >
      <StorySection
        title="Alert variants"
        description="All variants share the same padding, radius, left border, and title-anchored status dot. Only the tone changes."
      >
        <ThreeColumn>
          <StoryCard title="Status updates" caption="Info and success stay contextual instead of interruptive.">
            <Stack gap="2">
              <InlineAlert variant="info" title="NOTICE" body="A new node is available in your region." />
              <InlineAlert variant="success" title="CONNECTED" body="Traffic is now protected." />
            </Stack>
          </StoryCard>
          <StoryCard title="Attention states" caption="Warning and error need clearly different tints so they do not collapse into the same warm beige.">
            <Stack gap="2">
              <InlineAlert variant="warning" title="RENEW SOON" body="Your subscription expires in 3 days." />
              <InlineAlert variant="error" title="CONFIG INVALID" body="Download a fresh profile from Devices." />
            </Stack>
          </StoryCard>
          <StoryCard title="Actionable alert" caption="The action row aligns with the title and body column, never with the status dot.">
            <InlineAlert
              variant="info"
              title="SESSION EXPIRING"
              body="Reconnect now to keep secure traffic."
              actions={
                <>
                  <Button variant="secondary" size="md">Dismiss</Button>
                  <Button variant="primary" size="md">Reconnect</Button>
                </>
              }
            />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Inline link body"
        description="When an alert body includes a link, it should inherit the alert's own tone instead of reverting to a default blue hyperlink."
      >
        <UsageExample title="Payment follow-up" description="Inline links are a documented body pattern and should use the variant color family with underline.">
          <InlineAlert
            variant="warning"
            title="PAYMENT METHOD NEEDED"
            body={(
              <>
                Add a valid card to{" "}
                <a href="#billing">keep auto-renew active</a>.
              </>
            )}
          />
        </UsageExample>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="Validate alerts at real mobile content width, not only inside narrow story cards. Wrapping and action alignment change once the alert is rendered at the page width used by the miniapp."
      >
        <UsageExample title="Mobile full width" description="This is the reference render for 375px to 390px mobile widths with standard page insets.">
          <MobileInlineAlertStack />
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

export const Info: Story = {
  args: { variant: "info", title: "Info", body: "Informational message." },
};

export const Warning: Story = {
  args: { variant: "warning", title: "Warning", body: "Warning message." },
};

export const Error: Story = {
  args: { variant: "error", title: "Error", body: "Error message." },
};

export const Success: Story = {
  args: { variant: "success", title: "Success", body: "Success message." },
};

export const WithActions: Story = {
  args: {
    variant: "info",
    title: "SESSION EXPIRING",
    body: "Reconnect now to keep secure traffic.",
    actions: (
      <>
        <Button variant="secondary" size="md">Dismiss</Button>
        <Button variant="primary" size="md">Reconnect</Button>
      </>
    ),
  },
};

export const MobileFullWidth: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    layout: "fullscreen",
    chromatic: { viewports: [390, 375] },
  },
  render: () => <MobileInlineAlertStack />,
};

export const AlertDismissed: Story = {
  render: () => (
    <div className="inline-alert-story-frame">
      <InlineAlert
        variant="info"
        title="NOTICE"
        body="This alert is exiting after dismiss."
        className="alert-exit"
      />
    </div>
  ),
};

function MobileInlineAlertStack() {
  return (
    <div className="inline-alert-story-mobile">
      <InlineAlert variant="info" title="NOTICE" body="A new node is available in your region." />
      <InlineAlert variant="success" title="CONNECTED" body="Traffic is now protected." />
      <InlineAlert variant="warning" title="RENEW SOON" body="Your subscription expires in 3 days." />
      <InlineAlert variant="error" title="CONFIG INVALID" body="Download a fresh profile from Devices." />
      <InlineAlert
        variant="info"
        title="SESSION EXPIRING"
        body="Reconnect now to keep secure traffic."
        actions={
          <>
            <Button variant="secondary" size="md">Dismiss</Button>
            <Button variant="primary" size="md">Reconnect</Button>
          </>
        }
      />
      <InlineAlert
        variant="warning"
        title="PAYMENT METHOD NEEDED"
        body={(
          <>
            Add a valid card to{" "}
            <a href="#billing">keep auto-renew active</a>.
          </>
        )}
      />
    </div>
  );
}
