import { ConfirmDanger } from "@/design-system/components/feedback/Modal";
import { useI18n } from "@/hooks/useI18n";

export interface AccountCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmToken: string) => void | Promise<void>;
  loading?: boolean;
}

export function AccountCancellationModal({
  isOpen: open,
  onClose,
  onConfirm,
  loading = false,
}: AccountCancellationModalProps) {
  const { t } = useI18n();

  return (
    <ConfirmDanger
      isOpen={open}
      onClose={onClose}
      title={t("settings.delete_account_confirm_title")}
      message={t("settings.delete_account_confirm_message")}
      confirmLabel={t("settings.delete_account_confirm_label")}
      cancelLabel={t("settings.delete_account_cancel_label")}
      confirmTokenRequired
      confirmTokenLabel={t("settings.delete_account_token_label")}
      expectedConfirmValue="DELETE"
      onConfirm={(payload) => onConfirm(payload.confirm_token ?? "")}
      loading={loading}
    />
  );
}
