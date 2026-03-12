import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/design-system";
import { BottomSheet } from "./BottomSheet";
import styles from "./BottomSheet.module.css";

const meta = {
  title: "Pages/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
  args: {
    title: "Session details",
    subtitle: "AWG · REVIEW REQUIRED",
    bodyText:
      "Custom content goes in the body slot. Footer actions stay pinned at the bottom above the home indicator.",
    scrollContent: (
      <>
        <p>Contextual content lives in the scrollable slot.</p>
        <p>Swipe within this region to read more. Additional session metadata and configuration details appear here.</p>
      </>
    ),
    statusText: "Changes apply immediately",
    primaryLabel: "Confirm",
    secondaryLabel: "Cancel",
    onPrimary: () => undefined,
    onSecondary: () => undefined,
    onClose: () => undefined,
    open: true,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390, 430] },
    docs: {
      description: {
        component:
          "Mobile-first bottom sheet for the miniapp. It never dismisses on backdrop tap and keeps footer actions pinned while the contextual slot scrolls.",
      },
    },
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function StoryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4.25" y="3.75" width="11.5" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7.5H13M7 10H13M7 12.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const Open: Story = {
  args: {
    icon: <StoryIcon />,
    open: true,
  },
};

export const Closed: Story = {
  args: {
    icon: <StoryIcon />,
    open: false,
  },
};

export const WithoutStatus: Story = {
  args: {
    icon: <StoryIcon />,
    statusText: undefined,
    subtitle: "AWG · OPTIONAL REVIEW",
  },
};

export const LongContext: Story = {
  args: {
    icon: <StoryIcon />,
    scrollContent: (
      <>
        <p>Contextual content lives in the scrollable slot.</p>
        <p>Extended session notes, route hints, endpoint metadata, and delivery timing all stay inside the bounded region.</p>
        <p>Dragging inside the sheet body should not push the page behind it.</p>
        <p>The footer remains visible while this block scrolls.</p>
      </>
    ),
    statusText: "Ready to deploy",
    subtitle: "WG · CONTEXT ATTACHED",
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <div className={styles.storyTriggerWrap}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Open sheet
          </Button>
        </div>
        <BottomSheet
          {...args}
          icon={<StoryIcon />}
          open={open}
          onPrimary={() => setOpen(false)}
          onSecondary={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </>
    );
  },
  args: {
    open: false,
  },
};
