import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Popover } from "./Popover";
import { Button } from "@/design-system/components/Button";
import { IconCircleX, IconDownload, IconMoreVertical, IconPencil } from "@/design-system/icons";
import { StoryCard, StoryPage, StorySection, TwoColumn, UsageExample, ValuePill } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Components/Popover",
  tags: ["autodocs"],
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          "Popover renders as a floating panel on wider viewports and collapses into a bottom-sheet style panel below 430px. It supports measured placement, a single-open-instance contract, and optional auto-dismiss for transient notices.",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Popover"
      summary="Popover now has an explicit mobile contract: floating panel on larger viewports, bottom sheet below 430px, single-open-instance behavior, and optional auto-dismiss for passive notifications."
      stats={[
        { label: "Mobile", value: "bottom sheet" },
        { label: "Desktop", value: "anchored floating panel" },
        { label: "Placement", value: "flip + edge clamp" },
      ]}
    >
      <StorySection
        title="Popover behavior"
        description="Notification and action-menu popovers have different emphasis, but they share the same placement and dismissal rules."
      >
        <TwoColumn>
          <StoryCard title="Notification popover" caption="Success content is primary; dismiss stays lightweight and auto-dismiss can handle passive confirmations.">
            <NotificationPopoverDemo />
          </StoryCard>
          <StoryCard title="Quick actions menu" caption="Action lists should be visible in the story itself, including destructive actions and grouping separators.">
            <QuickActionsPopoverDemo />
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Placement contract"
        description="Desktop placement measures the trigger, keeps the requested inline edge when possible, and flips/clamps when space is constrained. Mobile ignores trigger-relative floating and uses a bottom sheet."
      >
        <UsageExample title="Documented fallback order" description="Below-end placement is preferred for action menus. When space runs out, the panel flips vertically and clamps within the viewport.">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ValuePill value="below-end" tone="accent" />
            <ValuePill value="above-end" tone="warning" />
            <ValuePill value="shifted" tone="danger" />
            <ValuePill value="<430px → sheet" tone="success" />
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

function NotificationPopoverDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ minHeight: 220, display: "grid", alignContent: "start", gap: 12 }}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        panelAriaLabel="Config updated"
        autoDismiss={5000}
        autoDismissOnInteraction
        renderTrigger={(props) => (
          <Button {...props} variant="ghost" onClick={() => setOpen((current) => !current)}>
            Toggle popover
          </Button>
        )}
      >
        <div className="miniapp-popover-notice">
          <div>
            <p className="miniapp-popover-notice-title">Config updated</p>
            <p className="miniapp-popover-notice-body">Your device profile was refreshed.</p>
          </div>
          <div className="miniapp-popover-notice-actions">
            <Button
              variant="ghost"
              size="sm"
              className="miniapp-popover-notice-dismiss"
              onClick={() => setOpen(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Popover>
    </div>
  );
}

function QuickActionsPopoverDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ minHeight: 260, display: "grid", alignContent: "start", gap: 12 }}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        preferredPlacement="bottom-end"
        panelAriaLabel="Quick actions"
        panelRole="menu"
        triggerHasPopup="menu"
        trapFocus
        panelClassName="miniapp-popover-panel--menu"
        renderTrigger={(props) => (
            <Button {...props} variant="ghost" onClick={() => setOpen((current) => !current)}>
            <IconMoreVertical size={16} strokeWidth={1.8} />
            Quick actions
          </Button>
        )}
      >
        <ul className="miniapp-menu-list" role="menu" aria-label="Quick actions">
          <li role="none">
            <button type="button" role="menuitem" className="miniapp-menu-item">
              <span className="miniapp-menu-item-icon" aria-hidden>
                <IconPencil size={16} strokeWidth={1.8} />
              </span>
              <span className="miniapp-menu-item-text">
                <span className="miniapp-menu-item-title">Rename device</span>
              </span>
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="miniapp-menu-item">
              <span className="miniapp-menu-item-icon" aria-hidden>
                <IconDownload size={16} strokeWidth={1.8} />
              </span>
              <span className="miniapp-menu-item-text">
                <span className="miniapp-menu-item-title">Download config</span>
              </span>
            </button>
          </li>
          <li role="separator" className="miniapp-menu-divider" />
          <li role="none">
            <button type="button" role="menuitem" className="miniapp-menu-item miniapp-menu-item--danger">
              <span className="miniapp-menu-item-icon" aria-hidden>
                <IconCircleX size={16} strokeWidth={1.8} />
              </span>
              <span className="miniapp-menu-item-text">
                <span className="miniapp-menu-item-title">Revoke access</span>
              </span>
            </button>
          </li>
        </ul>
      </Popover>
    </div>
  );
}

export const Default: Story = {
  render: () => <NotificationPopoverDemo />,
};

export const MobileBottomSheet: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
  },
  render: () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-end", padding: 16 }}>
      <QuickActionsPopoverDemo />
    </div>
  ),
};

export const NearBottomEdge: Story = {
  parameters: {
    chromatic: { viewports: [390, 768] },
  },
  render: () => <NearBottomEdgeDemo />,
};

function NearBottomEdgeDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ minHeight: "100vh", position: "relative", padding: 16 }}>
      <div style={{ position: "fixed", bottom: 80, right: 16 }}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          panelAriaLabel="Bottom edge fallback"
          renderTrigger={(props) => (
            <Button {...props} variant="ghost" onClick={() => setOpen((current) => !current)}>
              Edge trigger
            </Button>
          )}
        >
          <div className="miniapp-popover-notice">
            <div>
              <p className="miniapp-popover-notice-title">Placement fallback</p>
              <p className="miniapp-popover-notice-body">This story validates edge clamping on desktop and sheet fallback on mobile.</p>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
}
