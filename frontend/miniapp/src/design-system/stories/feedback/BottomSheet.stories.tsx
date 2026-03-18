import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const meta = {
  title: "Components/BottomSheet",
  tags: ["autodocs"],
  component: BottomSheet,
  parameters: {
    layout: "fullscreen",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Bottom sheet dialog. Always enters from bottom, has drag handle. Uses modal tokens.",
      },
    },
  },
  argTypes: {
    theme: {
      control: "inline-radio",
      options: ["dark", "light"],
      defaultValue: "dark",
    },
  },
  args: { theme: "dark" },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeWrapper({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      document.documentElement.dataset.theme = "";
    };
  }, [theme]);
  return <>{children}</>;
}

function DefaultDemo() {
  const [open, setOpen] = useState(false);
  return (
    <StoryShowcase>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Default sheet"
        actions={{ primary: { label: "Got it", onClick: () => setOpen(false) } }}
      >
        This is a bottom sheet. Swipe down to dismiss.
      </BottomSheet>
    </StoryShowcase>
  );
}

export const Default: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection
        title="Default"
        description="Trigger button opens sheet. Swipe down to dismiss."
      >
        <DefaultDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <StoryShowcase>
      <Button onClick={() => setOpen(true)}>Confirm action</Button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        subtitle="This action cannot be undone."
        actions={{
          primary: { label: "Confirm", onClick: () => setOpen(false) },
          secondary: { label: "Cancel", onClick: () => setOpen(false) },
        }}
      >
        Are you sure you want to proceed?
      </BottomSheet>
    </StoryShowcase>
  );
}

export const Confirm: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Confirm" description="Primary and secondary actions.">
        <ConfirmDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};

/** Alias for components-bottomsheet--confirm-flow (legacy/bookmark ID). */
export const ConfirmFlow: Story = { ...Confirm, name: "Confirm flow" };

function DangerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <StoryShowcase>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Delete account"
        subtitle="This will permanently remove your account."
        actions={{
          primary: {
            label: "Delete account",
            onClick: () => setOpen(false),
            tone: "danger",
          },
          secondary: { label: "Cancel", onClick: () => setOpen(false) },
        }}
      >
        All devices and billing history will be deleted.
      </BottomSheet>
    </StoryShowcase>
  );
}

export const Danger: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Danger" description="Destructive action with tone.">
        <DangerDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};

export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection
        title="Mobile view"
        description="Full-width on mobile viewport."
      >
        <ConfirmDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};

function LongContentDemo() {
  const [open, setOpen] = useState(false);
  return (
    <StoryShowcase>
      <Button onClick={() => setOpen(true)}>Terms of service</Button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Terms of service"
        actions={{ primary: { label: "Accept", onClick: () => setOpen(false) } }}
      >
        {Array(8)
          .fill(LOREM)
          .map((p, i) => (
            <p key={i}>
              {p}
            </p>
          ))}
      </BottomSheet>
    </StoryShowcase>
  );
}

export const LongContent: Story = {
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection
        title="Long content"
        description="Content area scrolls; header and footer stay fixed."
      >
        <LongContentDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};
