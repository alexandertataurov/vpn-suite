import { Button, Input, Modal } from "@/design-system";

export interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  hintText: string;
  nameLabel: string;
  nameValue: string;
  namePlaceholder: string;
  onNameChange: (value: string) => void;
  emailLabel: string;
  emailValue: string;
  emailPlaceholder: string;
  onEmailChange: (value: string) => void;
  phoneLabel: string;
  phoneValue: string;
  phonePlaceholder: string;
  onPhoneChange: (value: string) => void;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  savingLabel: string;
}

export function ProfileModal({
  open,
  onClose,
  title,
  description,
  hintText,
  nameLabel,
  nameValue,
  namePlaceholder,
  onNameChange,
  emailLabel,
  emailValue,
  emailPlaceholder,
  onEmailChange,
  phoneLabel,
  phoneValue,
  phonePlaceholder,
  onPhoneChange,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
  isSaving,
  savingLabel,
}: ProfileModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={title}
      description={description}
      className="settings-profile-modal"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSave}
            disabled={isSaving}
            status={isSaving ? "loading" : "idle"}
            statusText={savingLabel}
          >
            {saveLabel}
          </Button>
        </>
      }
    >
      <div className="settings-profile-modal__body">
        <p className="settings-profile-modal__hint">{hintText}</p>
        <Input
          type="text"
          label={nameLabel}
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={namePlaceholder}
          autoComplete="name"
        />
        <Input
          type="email"
          label={emailLabel}
          value={emailValue}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={emailPlaceholder}
          autoComplete="email"
        />
        <Input
          type="tel"
          label={phoneLabel}
          value={phoneValue}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder={phonePlaceholder}
          autoComplete="tel"
        />
      </div>
    </Modal>
  );
}
