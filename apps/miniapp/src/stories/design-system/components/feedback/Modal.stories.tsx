import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Modal } from "@/design-system/components/feedback/Modal";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

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
          "Overlay dialog for confirmations, destructive actions, and focused forms. Use the variant that matches the level of risk and keep the primary action obvious.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["plain", "confirm", "danger"], table: { category: "Appearance" } },
    theme: {
      control: "inline-radio",
      options: ["dark", "light"],
      table: { disable: true },
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Always-open inline baseline for reviewing header, body, and action layout before moving to the trigger-based interaction stories below.",
      },
    },
  },
  render: (args) => (
    <ThemeWrapper theme="dark">
      <StorySection title="Default" description="Always-open inline baseline for the modal content and footer contract.">
        <StoryShowcase>
          <Modal
            isOpen
            onClose={() => {}}
            inline
            title="Default modal"
            subtitle="Use this baseline to review spacing, title hierarchy, and footer actions."
            variant={args.variant}
            actions={{
              primary: { label: "Confirm", onClick: () => {} },
              secondary: { label: "Cancel", onClick: () => {} },
            }}
          >
            This is the baseline modal layout shown inline so the structure is visible without opening an overlay.
          </Modal>
        </StoryShowcase>
      </StorySection>
    </ThemeWrapper>
  ),
};

export const Interaction: Story = {
  name: "Trigger flow",
  parameters: {
    docs: {
      description: {
        story:
          "Trigger-based overlay scenario with a small interaction contract for opening and closing the modal.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Trigger flow" description="Open and dismiss the overlay modal from a local trigger.">
        <StoryShowcase>
          <DefaultDemo />
        </StoryShowcase>
      </StorySection>
    </ThemeWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Open modal" }));

    await expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expect(screen.getByRole("heading", { name: "Default modal" })).toBeInTheDocument();
    await expect(screen.getByText("This is the default modal.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  },
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
          "Subtitle text sits under the title and makes the confirm flow easier to scan.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="With description" description="Subtitle text adds context for confirm flows without changing the action hierarchy.">
        <StoryShowcase>
          <WithDescriptionDemo />
        </StoryShowcase>
      </StorySection>
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
          "inline=true renders the dialog in document flow instead of overlaying the page. Useful for Storybook previews and local layout checks.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Inline" description="Inline preview in document flow without the overlay portal.">
        <StoryShowcase>
          <InlineDemo />
        </StoryShowcase>
      </StorySection>
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
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    root.dataset.theme = theme;
    return () => {
      if (previousTheme == null) {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = previousTheme;
      }
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
          "Compare the three variants: plain for information, confirm for acknowledgement, danger for destructive actions.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Variants" description="Compare plain, confirm, and danger modal actions and copy hierarchy.">
        <StoryShowcase>
          <VariantsDemo />
        </StoryShowcase>
      </StorySection>
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
          "Primary action can enter a loading state while keeping the dialog open. Use this for async confirmation flows.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Loading state" description="Primary action loading while the modal remains open.">
        <StoryShowcase>
          <LoadingDemo />
        </StoryShowcase>
      </StorySection>
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
          "Long content scrolls while header and footer remain fixed. This checks max-height behavior and footer persistence.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Long content" description="Scrollable content with persistent header and footer actions.">
        <StoryShowcase>
          <LongContentDemo />
        </StoryShowcase>
      </StorySection>
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
    viewport: { defaultViewport: "mobile390" },
    docs: {
      description: {
        story:
          "Mobile modal layout should adapt to the narrow viewport and stack the footer actions vertically.",
      },
    },
  },
  render: () => (
    <ThemeWrapper theme="dark">
      <StorySection title="Mobile layout" description="Confirm flow on a narrow viewport.">
        <StoryShowcase>
          <MobileViewDemo />
        </StoryShowcase>
      </StorySection>
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
