import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/design-system";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";

const meta = {
  title: "Components/Modal",
  tags: ["autodocs"],
  component: Modal,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Overlay dialog. Variants: plain, confirm, danger. Uses design tokens. Escape to close.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["plain", "confirm", "danger"] },
    theme: {
      control: "inline-radio",
      options: ["dark", "light"],
      defaultValue: "dark",
    },
  },
  args: { theme: "dark" },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <DefaultDemo />
    </ThemeWrapper>
  ),
};

function DefaultDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Default modal"
        actions={{
          primary: { label: "Got it", onClick: () => setOpen(false) },
        }}
      >
        This is the default modal.
      </Modal>
    </>
  );
}

export const WithDescription: Story = {
  name: "With description",
  parameters: {
    docs: {
      description: {
        story:
          "Modal with subtitle/description below the title. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <WithDescriptionDemo />
    </ThemeWrapper>
  ),
};

function WithDescriptionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with description</Button>
      <Modal
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
      </Modal>
    </>
  );
}

export const Inline: Story = {
  name: "Inline",
  parameters: {
    docs: {
      description: {
        story:
          "inline=true renders modal in document flow instead of overlay. Useful for Storybook previews. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <InlineDemo />
      </div>
    </ThemeWrapper>
  ),
};

function InlineDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Inline modal"
      inline
      actions={{
        primary: { label: "Got it", onClick: () => setOpen(false) },
        secondary: { label: "Cancel", onClick: () => setOpen(false) },
      }}
    >
      Rendered inline in document flow. No overlay portal.
    </Modal>
  );
}

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
      document.documentElement.dataset.theme = "dark";
    };
  }, [theme]);
  return <>{children}</>;
}

export const Variants: Story = {
  name: "Variants",
  parameters: {
    docs: {
      description: {
        story:
          "plain: informational. confirm: requires acknowledgement. danger: destructive — header is red-tinted, title is red. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <VariantsDemo />
      </div>
    </ThemeWrapper>
  ),
};

function VariantsDemo() {
  const [plainOpen, setPlainOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setPlainOpen(true)}>Open plain</Button>
      <Button onClick={() => setConfirmOpen(true)}>Open confirm</Button>
      <Button onClick={() => setDangerOpen(true)}>Open danger</Button>

      <Modal
        isOpen={plainOpen}
        onClose={() => setPlainOpen(false)}
        title="Plain modal"
        variant="plain"
        actions={{ primary: { label: "Got it", onClick: () => setPlainOpen(false) } }}
      >
        This is a plain informational modal.
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm action"
        subtitle="This action cannot be undone."
        variant="confirm"
        actions={{
          primary: { label: "Confirm", onClick: () => setConfirmOpen(false) },
          secondary: { label: "Cancel", onClick: () => setConfirmOpen(false) },
        }}
      >
        Are you sure you want to proceed? All changes will be applied.
      </Modal>

      <Modal
        isOpen={dangerOpen}
        onClose={() => setDangerOpen(false)}
        title="Delete account"
        subtitle="This will permanently remove your account."
        variant="danger"
        actions={{
          primary: {
            label: "Delete account",
            onClick: () => setDangerOpen(false),
            tone: "danger",
          },
          secondary: { label: "Cancel", onClick: () => setDangerOpen(false) },
        }}
      >
        All your devices, configurations, and billing history will be deleted. This
        cannot be reversed.
      </Modal>
    </>
  );
}

export const Loading: Story = {
  name: "Loading state",
  parameters: {
    docs: {
      description: {
        story:
          "Primary action enters loading state on click. Button shows spinner, modal stays open. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <LoadingDemo />
    </ThemeWrapper>
  ),
};

function LoadingDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open loading modal</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Save changes"
        actions={{
          primary: { label: "Save", onClick: () => {}, loading: true },
          secondary: { label: "Cancel", onClick: () => setOpen(false) },
        }}
      >
        Your preferences will be updated.
      </Modal>
    </>
  );
}

export const LongContent: Story = {
  name: "Long content",
  parameters: {
    docs: {
      description: {
        story:
          "Content area scrolls when taller than max-height. Header and footer remain fixed. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <LongContentDemo />
    </ThemeWrapper>
  ),
};

function LongContentDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open terms</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Terms of service"
        actions={{
          primary: { label: "Accept", onClick: () => setOpen(false) },
          secondary: { label: "Decline", onClick: () => setOpen(false) },
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <p key={i}>{LOREM}</p>
        ))}
      </Modal>
    </>
  );
}

export const MobileView: Story = {
  name: "Mobile layout",
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
    docs: {
      description: {
        story:
          "Below 480px: slides up from bottom, full width, rounded top corners only. Footer buttons stack vertically. Use the Theme control in the Controls panel to switch between dark and light theme for this modal.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme={args.theme ?? "dark"}>
      <MobileViewDemo />
    </ThemeWrapper>
  ),
};

function MobileViewDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open confirm</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        subtitle="This action cannot be undone."
        variant="confirm"
        actions={{
          primary: { label: "Confirm", onClick: () => setOpen(false) },
          secondary: { label: "Cancel", onClick: () => setOpen(false) },
        }}
      >
        Are you sure you want to proceed? All changes will be applied.
      </Modal>
    </>
  );
}
