import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ProfileModal } from "./ProfileModal";
import { Button, StoryShowcase } from "@/design-system";

const meta: Meta<typeof ProfileModal> = {
  title: "Recipes/Settings/ProfileModal",
  tags: ["autodocs"],
  component: ProfileModal,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Profile edit modal with name, email, phone fields.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

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
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        description="Update your profile details"
        hintText="Changes are saved to your account."
        nameLabel="Name"
        nameValue={name}
        namePlaceholder="Your name"
        onNameChange={setName}
        emailLabel="Email"
        emailValue={email}
        emailPlaceholder="you@example.com"
        onEmailChange={setEmail}
        phoneLabel="Phone"
        phoneValue={phone}
        phonePlaceholder="+1 555 0000"
        onPhoneChange={setPhone}
        cancelLabel="Cancel"
        saveLabel="Save"
        onCancel={() => setOpen(false)}
        onSave={() => setOpen(false)}
        isSaving={false}
        savingLabel="Saving..."
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

export const Open: Story = {
  render: () => (
    <StoryShowcase>
      <ProfileModal
        isOpen={true}
        onClose={() => {}}
        title="Edit profile"
        description="Update your profile details"
        hintText="Changes are saved to your account."
        nameLabel="Name"
        nameValue="Alex Morgan"
        namePlaceholder="Your name"
        onNameChange={() => {}}
        emailLabel="Email"
        emailValue="alex@example.com"
        emailPlaceholder="you@example.com"
        onEmailChange={() => {}}
        phoneLabel="Phone"
        phoneValue="+1 555 0100"
        phonePlaceholder="+1 555 0000"
        onPhoneChange={() => {}}
        cancelLabel="Cancel"
        saveLabel="Save"
        onCancel={() => {}}
        onSave={() => {}}
        isSaving={false}
        savingLabel="Saving..."
      />
    </StoryShowcase>
  ),
};

export const Saving: Story = {
  render: () => (
    <StoryShowcase>
      <ProfileModal
        isOpen={true}
        onClose={() => {}}
        title="Edit profile"
        description="Update your profile details"
        hintText="Changes are saved to your account."
        nameLabel="Name"
        nameValue="Alex Morgan"
        namePlaceholder="Your name"
        onNameChange={() => {}}
        emailLabel="Email"
        emailValue="alex@example.com"
        emailPlaceholder="you@example.com"
        onEmailChange={() => {}}
        phoneLabel="Phone"
        phoneValue="+1 555 0100"
        phonePlaceholder="+1 555 0000"
        onPhoneChange={() => {}}
        cancelLabel="Cancel"
        saveLabel="Save"
        onCancel={() => {}}
        onSave={() => {}}
        isSaving={true}
        savingLabel="Saving..."
      />
    </StoryShowcase>
  ),
};
