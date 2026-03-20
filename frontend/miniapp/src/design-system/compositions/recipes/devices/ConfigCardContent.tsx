import { useEffect, useState } from "react";
import { IconDownload } from "@/design-system/icons";
import { useI18n } from "@/hooks";
import { ButtonRowAuto, MissionPrimaryButton, MissionSecondaryButton } from "../../patterns";
import { CompactSummaryCard } from "./CompactSummaryCard";
import { VpnBoundaryNote } from "../shared/VpnBoundaryNote";

export interface ConfigCardContentProps {
  configText: string;
  routeReason: string;
  peerCreated?: boolean;
  onCopy: () => Promise<boolean>;
  onDownload: () => void;
}

export function ConfigCardContent({
  configText,
  routeReason,
  peerCreated = true,
  onCopy,
  onDownload,
}: ConfigCardContentProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isPending = routeReason === "connection_not_confirmed";
  const title = isPending
    ? t("devices.config_pending_title")
    : t("devices.config_ready_title");
  const message = isPending
    ? t("devices.config_pending_message")
    : t("devices.config_ready_message");

  useEffect(() => {
    if (!copied) return undefined;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    setCopied(false);
    const didCopy = await onCopy();
    if (didCopy) {
      setCopied(true);
    }
  };

  return (
    <CompactSummaryCard
      className="devices-utility-card"
      eyebrow={t("devices.section_config_title")}
      title={title}
      subtitle={message}
      tone="amber"
      actions={(
        <ButtonRowAuto className="devices-config-actions">
          <MissionPrimaryButton
            status={copied ? "success" : "idle"}
            statusText={t("devices.toast_copied")}
            successText={t("devices.toast_copied")}
            onClick={() => void handleCopy()}
            className="miniapp-compact-action"
          >
            {t("devices.copy_config_action")}
          </MissionPrimaryButton>
          <MissionSecondaryButton
            onClick={onDownload}
            className="miniapp-compact-action miniapp-compact-action--secondary"
            startIcon={<IconDownload size={14} strokeWidth={1.8} aria-hidden />}
          >
            {t("devices.download_config_action")}
          </MissionSecondaryButton>
        </ButtonRowAuto>
      )}
    >
      {!peerCreated ? (
        <VpnBoundaryNote tone="warning" messageKey="devices.config_preparing_message" />
      ) : (
        <VpnBoundaryNote messageKey="devices.config_boundary_note" />
      )}
      <details className="config-disclosure">
        <summary>{t("devices.config_view_raw")}</summary>
        <pre className="config-pre config-block">{configText}</pre>
      </details>
    </CompactSummaryCard>
  );
}
