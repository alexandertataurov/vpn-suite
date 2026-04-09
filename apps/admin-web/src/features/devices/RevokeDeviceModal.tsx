import { Button, Input, Modal } from "@/design-system/primitives";

const REVOKE_TOKEN_ID = "devices-revoke-token";

interface RevokeDeviceModalProps {
  open: boolean;
  onClose: () => void;
  revokeToken: string;
  onRevokeTokenChange: (value: string) => void;
  onConfirm: () => void;
  pending: boolean;
}

export function RevokeDeviceModal({
  open,
  onClose,
  revokeToken,
  onRevokeTokenChange,
  onConfirm,
  pending,
}: RevokeDeviceModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Revoke device">
      <p className="devices-page__revoke-hint">
        Enter the confirmation token to revoke this device.
      </p>
      <label className="devices-page__revoke-label" htmlFor={REVOKE_TOKEN_ID}>
        Confirm token
        <Input
          id={REVOKE_TOKEN_ID}
          type="password"
          value={revokeToken}
          onChange={(e) => onRevokeTokenChange(e.target.value)}
          placeholder="Token"
          aria-label="Revoke confirmation token"
        />
      </label>
      <div className="devices-page__revoke-actions">
        <Button type="button" variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={!revokeToken.trim() || pending}
        >
          Revoke
        </Button>
      </div>
    </Modal>
  );
}
