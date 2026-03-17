import { CompactSummaryCard, MissionPrimaryButton, MissionPrimaryLink } from "@/design-system";
import { useI18n } from "@/hooks";
import { VpnBoundaryNote } from "@/components/VpnBoundaryNote";

export interface ConnectStatusVerifyCardProps {
  showConfirmAction: boolean;
  isConfirming: boolean;
  primaryAction:
    | { kind: "route"; label: string; to: string }
    | { kind: "open_app"; label: string; payload: string }
    | null;
  onConfirm: () => void;
  onOpenApp: (payload: string) => void;
}

export function ConnectStatusVerifyCard({
  showConfirmAction,
  isConfirming,
  primaryAction,
  onConfirm,
  onOpenApp,
}: ConnectStatusVerifyCardProps) {
  const { t } = useI18n();

  return (
    <CompactSummaryCard
      eyebrow={t("connect_status.verify_section_title")}
      title={showConfirmAction ? t("connect_status.summary_pending_title") : t("connect_status.summary_confirmed_title")}
      subtitle={t("connect_status.verify_section_description")}
      tone={showConfirmAction ? "amber" : "green"}
      actions={showConfirmAction ? (
        <MissionPrimaryButton
          onClick={onConfirm}
          disabled={isConfirming}
          status={isConfirming ? "loading" : "idle"}
          statusText={t("connect_status.confirm_button_loading")}
          className="miniapp-compact-action"
        >
          {t("connect_status.confirm_button_label")}
        </MissionPrimaryButton>
      ) : primaryAction ? (
        primaryAction.kind === "route" ? (
          <MissionPrimaryLink to={primaryAction.to} className="miniapp-compact-action">
            {primaryAction.label}
          </MissionPrimaryLink>
        ) : (
          <MissionPrimaryButton onClick={() => onOpenApp(primaryAction.payload)} className="miniapp-compact-action">
            {primaryAction.label}
          </MissionPrimaryButton>
        )
      ) : undefined}
    >
      <VpnBoundaryNote messageKey="connect_status.boundary_note" />
    </CompactSummaryCard>
  );
}
