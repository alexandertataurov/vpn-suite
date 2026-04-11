import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/app/components/BottomSheet";
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
          "Bottom sheet dialog for mobile-first flows. It enters from the bottom, includes a drag handle, and uses modal tokens for overlay and surface styling.",
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
    const previousTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (previousTheme == null) {
        delete document.documentElement.dataset.theme;
      } else {
        document.documentElement.dataset.theme = previousTheme;
      }
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
  parameters: {
    docs: {
      description: {
        story:
          "Default bottom sheet opened from a button. Use this to review the entry motion and close interaction.",
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          "Confirmation flow with primary and secondary actions. This is the common non-destructive sheet pattern.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <StorySection title="Confirm" description="Primary and secondary actions.">
        <ConfirmDemo />
      </StorySection>
    </ThemeWrapper>
  ),
};

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
  parameters: {
    docs: {
      description: {
        story:
          "Destructive sheet with danger tone on the primary action. Use it to review the red-action contract.",
      },
    },
  },
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
    docs: {
      description: {
        story:
          "The same confirmation flow on a narrow viewport. This guards against clipped headers or cramped actions.",
      },
    },
    viewport: { defaultViewport: "mobile390" },
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
  parameters: {
    docs: {
      description: {
        story:
          "Long content with a sticky header and footer. Use it to verify the body scrolls while actions stay reachable.",
      },
    },
  },
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
