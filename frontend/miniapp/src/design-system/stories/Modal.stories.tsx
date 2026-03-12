import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Button, ConfirmDanger, Input, Modal } from "../components";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Components/Modal",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Modal, ConfirmModal, and ConfirmDanger. On mobile these present as bottom sheets; on desktop they remain centered dialogs.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Modal"
      summary="The modal family uses centered dialogs on desktop and bottom sheets on mobile. The showcase documents open states directly so static Storybook viewers can see the actual contract, not only the trigger buttons."
      stats={[
        { label: "Variants", value: "plain/confirm/danger" },
        { label: "Focus trap", value: "yes" },
        { label: "Mobile mode", value: "bottom sheet" },
      ]}
    >
      <StorySection
        title="Open-state patterns"
        description="Each modal type has a distinct structure and dismissal contract. The trigger only hints at intent; the real pattern is the open sheet."
      >
        <div className="layout-story-mobile-grid">
          <StoryCard title="Plain modal" caption="Neutral trigger, scrollable content slot, sticky footer, and optional close icon.">
            <ModalStoryPreview label="390px mobile sheet">
              <PlainOpenModal />
            </ModalStoryPreview>
          </StoryCard>
          <StoryCard title="Confirm modal" caption="Primary CTA pair, no close icon, and cancel is the only exit.">
            <ModalStoryPreview label="390px mobile sheet">
              <ConfirmOpenModal />
            </ModalStoryPreview>
          </StoryCard>
          <StoryCard title="Danger confirmation" caption="High-friction destructive flow with warning card, confirm token input, and locked dismissal.">
            <ModalStoryPreview label="390px mobile sheet">
              <DangerOpenModal />
            </ModalStoryPreview>
          </StoryCard>
        </div>
      </StorySection>

      <StorySection
        title="Interaction contracts"
        description="Focus, dismissal, motion, and async locking need to be documented as part of the modal component contract, especially for Telegram WebView."
      >
        <TwoColumn>
          <UsageExample title="Dismiss and focus trap" description="Non-danger modals can dismiss via backdrop tap, Escape, or Android back. Danger modals require explicit Cancel and always trap focus until closed.">
            <Stack gap="2">
              <div className="modal-story-contract-row">
                <strong>On open</strong>
                <span>Focus moves to the first interactive control in the sheet.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>While open</strong>
                <span>`Tab` stays trapped inside the modal and never reaches background content.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>On close</strong>
                <span>Focus returns to the trigger that opened the sheet.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>Keyboard open</strong>
                <span>Scrollable body content should adjust so focused fields stay visible above the virtual keyboard.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>Confirm sheets</strong>
                <span>No close icon, no backdrop dismiss, and no swipe dismiss. Escape maps to Cancel on desktop.</span>
              </div>
            </Stack>
          </UsageExample>
          <UsageExample title="Motion and swipe" description="Sheets and backdrop animate together. Swipe-to-dismiss is reserved for plain sheets and disabled while inputs are focused or loading is active.">
            <Stack gap="2">
              <div className="modal-story-contract-row">
                <strong>Entry</strong>
                <span>`280ms` sheet + backdrop with `cubic-bezier(0.32, 0.72, 0, 1)`.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>Exit</strong>
                <span>`220ms` and slightly faster than entry so dismiss feels responsive.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>Swipe threshold</strong>
                <span>Dismiss at `40px` drag distance or `500px/s` downward velocity.</span>
              </div>
              <div className="modal-story-contract-row">
                <strong>Danger exception</strong>
                <span>No swipe dismiss, no backdrop dismiss, and no drag handle for danger sheets.</span>
              </div>
            </Stack>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Loading and friction"
        description="Danger flows need explicit friction, and async modal actions must lock the sheet until the request resolves."
      >
        <TwoColumn>
          <UsageExample title="Danger friction" description="Type-to-confirm is the audit-detail pattern for irreversible destructive flows.">
            <ModalStoryPreview label="390px mobile sheet">
              <DangerOpenModal />
            </ModalStoryPreview>
          </UsageExample>
          <UsageExample title="Loading state" description="During async work the primary CTA shows progress, Cancel is disabled, and the sheet is not dismissible.">
            <ModalStoryPreview label="390px mobile sheet">
              <LoadingOpenModal />
            </ModalStoryPreview>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Interactive demos"
        description="Keep a small trigger-based section for behavior checks, but never rely on it as the only documentation of modal structure."
      >
        <ThreeColumn>
          <StoryCard title="Plain trigger" caption="Neutral trigger for a contextual modal.">
            <PlainInteractiveDemo />
          </StoryCard>
          <StoryCard title="Confirm trigger" caption="Primary trigger for a straightforward yes or no decision.">
            <ConfirmInteractiveDemo />
          </StoryCard>
          <StoryCard title="Danger trigger" caption="Red outline trigger for high-friction destructive actions.">
            <DangerInteractiveDemo />
          </StoryCard>
        </ThreeColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const Default: Story = {
  render: () => <PlainInteractiveDemo />,
};

export const Confirm: Story = {
  render: () => <ConfirmInteractiveDemo />,
};

export const Danger: Story = {
  render: () => <DangerInteractiveDemo />,
};

export const PlainOpen: Story = {
  render: () => <PlainOpenModal />,
  parameters: { viewport: { defaultViewport: "mobile1" }, chromatic: { viewports: [390, 375] } },
};

export const ConfirmOpen: Story = {
  render: () => <ConfirmOpenModal />,
  parameters: { viewport: { defaultViewport: "mobile1" }, chromatic: { viewports: [390, 375] } },
};

export const DangerOpen: Story = {
  render: () => <DangerOpenModal />,
  parameters: { viewport: { defaultViewport: "mobile1" }, chromatic: { viewports: [390, 375] } },
};

export const LoadingOpen: Story = {
  render: () => <LoadingOpenModal />,
  parameters: { viewport: { defaultViewport: "mobile1" }, chromatic: { viewports: [390, 375] } },
};

function PlainInteractiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Session details"
        description="Custom content goes in the body slot and footer actions stay pinned."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Secondary</Button>
            <Button onClick={() => setOpen(false)}>Primary</Button>
          </>
        }
      >
        <p className="modal-message">Contextual content lives in the scrollable content slot.</p>
      </Modal>
    </>
  );
}

function ModalStoryPreview({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="layout-story-mobile-preview">
      <div className="layout-story-mobile-label">{label}</div>
      <div style={modalStoryPreviewFrameStyle}>
        <div style={modalStoryPreviewInnerStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfirmInteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Confirm</Button>
      <DisconnectStoryModal
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          setLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 700));
          setLoading(false);
          setOpen(false);
        }}
      />
    </>
  );
}

function DangerInteractiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" tone="danger" onClick={() => setOpen(true)}>Delete</Button>
      <ConfirmDanger
        open={open}
        onClose={() => setOpen(false)}
        title="Delete configuration?"
        message="This will revoke access for all linked devices."
        confirmTokenRequired
        confirmTokenLabel="Type DELETE to confirm"
        expectedConfirmValue="DELETE"
        confirmLabel="Delete config"
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

function PlainOpenModal() {
  return (
    <Modal
      open
      onClose={() => {}}
      title="Session details"
      description="Header, content, and footer are separate slots. Content scrolls and the footer stays visible."
      footer={
        <>
          <Button variant="secondary">Secondary</Button>
          <Button>Primary</Button>
        </>
      }
      inline
      variant="plain"
    >
      <div className="modal-long-body">
        <p className="modal-message">This is the scrollable content slot.</p>
        {Array.from({ length: 5 }).map((_, index) => (
          <p key={index} className="modal-message">
            Content line {index + 1}. The body can grow without pushing the footer off screen.
          </p>
        ))}
      </div>
    </Modal>
  );
}

function ConfirmOpenModal() {
  return (
    <DisconnectStoryModal open onClose={() => {}} onConfirm={() => {}} />
  );
}

function DangerOpenModal() {
  return (
    <Modal
      open
      onClose={() => {}}
      title="Delete configuration?"
      footer={
        <>
          <Button variant="danger" className="modal-danger-confirm modal-danger-confirm--disabled" disabled>Delete config</Button>
          <Button variant="ghost">Cancel</Button>
        </>
      }
      inline
      variant="danger"
      showCloseButton={false}
      showHandle={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
      swipeToDismiss={false}
    >
      <Stack gap="3">
        <div className="danger-warning">
          <p className="modal-message">
            This will revoke access for all linked devices.
          </p>
        </div>
        <Input
          label="Type DELETE to confirm"
          value=""
          onChange={() => {}}
          placeholder="Type DELETE to confirm"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </Stack>
    </Modal>
  );
}

function LoadingOpenModal() {
  return (
    <Modal
      open
      onClose={() => {}}
      title="Deleting configuration…"
      footer={
        <>
          <Button variant="ghost" disabled>Cancel</Button>
          <Button variant="danger" loading>Delete config</Button>
        </>
      }
      inline
      variant="danger"
      showCloseButton={false}
      showHandle={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
      swipeToDismiss={false}
      disableDismiss
    >
      <p className="modal-message">
        The request is in progress. The sheet remains locked until the operation succeeds or fails.
      </p>
    </Modal>
  );
}

function DisconnectStoryModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Disconnect tunnel?"
      footer={
        <>
          <Button
            variant="outline"
            className="modal-story-disconnect-btn modal-story-disconnect-btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="modal-story-disconnect-btn modal-story-disconnect-btn--confirm"
            onClick={onConfirm}
            loading={loading}
          >
            Disconnect now
          </Button>
        </>
      }
      inline
      variant="confirm"
      className="modal-story-disconnect-sheet"
      showCloseButton={false}
      showHandle={true}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      swipeToDismiss={!loading}
      disableDismiss={loading}
    >
      <p className="modal-message modal-story-disconnect-message">
        Your traffic will be unprotected until you reconnect.
      </p>
    </Modal>
  );
}

const modalStoryPreviewFrameStyle: CSSProperties = {
  width: "min(100%, 390px)",
  minHeight: "720px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "stretch",
  padding: "0",
  overflow: "hidden",
  borderRadius: "32px",
  border: "1px solid color-mix(in oklch, var(--color-border) 88%, var(--color-text) 12%)",
  background:
    "radial-gradient(circle at top, color-mix(in oklch, var(--color-accent) 7%, transparent) 0%, transparent 34%), linear-gradient(180deg, color-mix(in oklch, var(--color-surface) 82%, var(--color-bg) 18%) 0%, var(--color-bg) 100%)",
  boxShadow:
    "inset 0 1px 0 color-mix(in oklch, white 6%, transparent), 0 18px 42px color-mix(in oklch, black 30%, transparent)",
};

const modalStoryPreviewInnerStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "stretch",
  minHeight: "100%",
  padding: "0",
};
