import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ComponentProps } from "react";
import { Button, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { ProfileModal } from "./ProfileModal";

const meta: Meta<typeof ProfileModal> = {
  title: "Recipes/Settings/ProfileModal",
  tags: ["autodocs"],
  component: ProfileModal,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Settings profile edit modal, kept in the recipe layer as the canonical visual contract.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const profileModalBaseProps = {
  onClose: () => {},
  title: "Edit profile",
  description: "Update your profile details",
  hintText: "Changes are saved to your account.",
  nameLabel: "Name",
  nameValue: "Alex Morgan",
  namePlaceholder: "Your name",
  onNameChange: () => {},
  emailLabel: "Email",
  emailValue: "alex@example.com",
  emailPlaceholder: "you@example.com",
  onEmailChange: () => {},
  phoneLabel: "Phone",
  phoneValue: "+1 555 0100",
  phonePlaceholder: "+1 555 0000",
  onPhoneChange: () => {},
  cancelLabel: "Cancel",
  saveLabel: "Save",
  onCancel: () => {},
  onSave: () => {},
  savingLabel: "Saving...",
} satisfies Partial<ComponentProps<typeof ProfileModal>>;

function ModalWithState() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
  const [phone, setPhone] = useState("+1 555 0100");

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open profile modal
      </Button>
      <ProfileModal
        {...profileModalBaseProps}
        isOpen={open}
        nameValue={name}
        onNameChange={setName}
        emailValue={email}
        onEmailChange={setEmail}
        phoneValue={phone}
        onPhoneChange={setPhone}
        onCancel={() => setOpen(false)}
        onSave={() => setOpen(false)}
        isSaving={false}
      />
    </>
  );
}

export const Default: Story = {
  render: () => (
    <StoryShowcase>
      <ModalWithState />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Open and saving states.">
      <StoryShowcase>
        <StoryStack>
          <ProfileModal
            {...profileModalBaseProps}
            isOpen
            isSaving={false}
          />
          <ProfileModal
            {...profileModalBaseProps}
            isOpen
            isSaving
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
