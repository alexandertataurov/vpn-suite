import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/utils/error";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import type { WebAppIssueDeviceResponse } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "@/api/client";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import {
  FallbackScreen,
  Skeleton,
  useToast,
  ConfirmModal,
  PageFrame,
  SectionDivider,
  SummaryHero,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionOperationArticle,
  MissionPrimaryButton,
  MissionSecondaryButton,
  SessionMissing,
} from "@/design-system";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function formatIssuedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function DevicesPage() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const configSectionRef = useRef<HTMLDivElement | null>(null);
  const { impact, notify } = useTelegramHaptics();
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  useTrackScreen("devices", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const issueMutation = useMutation({
    mutationFn: () => webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {}),
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      track("config_download", { screen_name: "devices" });
      if (res.peer_created) {
        addToast("Device added and activated", "success");
        notify("success");
      } else {
        addToast("Device created. Server sync pending. If VPN fails, retry later or contact support.", "info");
      }
    },
    onError: (err) => {
      const msg = getErrorMessage(err, "Failed to add device");
      addToast(msg, "error");
      notify("error");
    },
  });

  const deviceLimit = activeSub?.device_limit ?? null;

  const configText =
    issuedConfig?.config_awg ??
    issuedConfig?.config ??
    issuedConfig?.config_wg_obf ??
    issuedConfig?.config_wg ??
    "";

  const handleDownloadConfig = () => {
    if (!configText) return;
    try {
      const shortId = issuedConfig?.device_id?.slice(0, 8) || "device";
      const fileName = `vpn-config-${shortId}.conf`;
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string }) => Promise<void>;
      };
      const mimeType = "application/octet-stream";
      const file = new File([configText], fileName, { type: mimeType });
      const canUseShareWithFiles =
        typeof nav.share === "function" &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] });

      if (canUseShareWithFiles) {
        void nav
          .share({
            files: [file],
            title: "VPN config",
          })
          .then(() => addToast("Config ready to save/share", "success"))
          .catch(() => addToast("Could not open share sheet. Try download or copy instead.", "error"));
        return;
      }

      const blob = new Blob([configText], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      addToast("Could not download config. Please copy it manually.", "error");
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeId) return;
      await webappApi.post(`/webapp/devices/${revokeId}/revoke`);
    },
    onSuccess: () => {
      addToast("Device revoked", "success");
      notify("success");
      track("device_removal", { screen_name: "devices" });
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => {
      addToast("Failed to revoke device", "error");
      setRevokeId(null);
    },
  });

  useTelegramMainButton(null);
  const canAddDevice = activeSub && (deviceLimit == null || activeDevices.length < deviceLimit) && isOnline;

  useEffect(() => {
    if (issuedConfig && configSectionRef.current) {
      configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [issuedConfig]);

  if (!hasToken) {
    return <SessionMissing />;
  }
  if (error) {
    return (
      <FallbackScreen
        title="Could not load devices"
        message="We could not load your devices. Please try again or contact support."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["webapp", "me"] })}
      />
    );
  }
  if (isLoading) {
    return (
      <PageFrame title="My devices" subtitle="Add and manage VPN configs">
        <Skeleton className="skeleton-h-hero" />
        <Skeleton className="skeleton-h-lg" />
        <Skeleton className="skeleton-h-lg" />
      </PageFrame>
    );
  }

  const deviceSummary =
    deviceLimit != null
      ? `${activeDevices.length} / ${deviceLimit} active`
      : `${activeDevices.length} device${activeDevices.length === 1 ? "" : "s"}`;

  return (
    <PageFrame title="Devices & Access" subtitle="Add and manage VPN configs">
      <SummaryHero
        eyebrow="Devices"
        title={deviceSummary}
        subtitle={activeDevices.length === 0 ? "Add a device to get your VPN config" : undefined}
        edge="e-b"
        glow="g-blue"
        className="stagger-1"
      />

      {issuedConfig && (
        <div ref={configSectionRef} className="stagger-2">
          <SectionDivider label="Your config" count="Sensitive" />
            <MissionCard tone="amber" className="module-card">
              <MissionAlert
                tone="info"
                title="Shown only once"
                message="After you leave this screen, the config may no longer be visible. Use Copy or Download now."
              />
              {!issuedConfig.peer_created && (
                <MissionAlert
                  tone="warning"
                  title="Server sync pending"
                  message="Your device is registered. If connection fails, retry later or contact support."
                />
              )}
              <div className="btn-row">
                <MissionSecondaryButton
                  onClick={async () => {
                    if (!configText) return;
                    try {
                      await navigator.clipboard.writeText(configText);
                      addToast("Config copied to clipboard", "success");
                    } catch {
                      addToast("Could not copy config. Please select and copy manually.", "error");
                    }
                  }}
                >
                  Copy config
                </MissionSecondaryButton>
                <MissionSecondaryButton onClick={handleDownloadConfig}>
                  Download .conf file
                </MissionSecondaryButton>
              </div>
              <pre className="config-pre config-block">{configText}</pre>
            </MissionCard>
        </div>
      )}

      <SectionDivider
        label="Active Devices"
        count={`${activeDevices.length} online`}
        className="stagger-3"
      />
      <div className="stagger-4">
        {issueMutation.isError && (
          <MissionAlert
            tone="error"
            title="Could not add device"
            message={getErrorMessage(issueMutation.error, "Try again or contact support.")}
          />
        )}
        {canAddDevice && (
          <div className="btn-row">
            <MissionPrimaryButton
              onClick={() => {
                impact("medium");
                issueMutation.mutate();
              }}
              disabled={issueMutation.isPending}
            >
              {issueMutation.isPending ? (
                <>
                  <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                    <path d="M20 12a8 8 0 0 0-8-8" />
                  </svg>
                  <span>Adding…</span>
                </>
              ) : (
                "Add device"
              )}
            </MissionPrimaryButton>
          </div>
        )}

        <div className="ops">
          {data?.devices?.map((d) => {
            const isRevoked = !!d.revoked_at;
            return (
              <MissionOperationArticle
                key={d.id}
                tone={isRevoked ? "red" : "green"}
                iconTone={isRevoked ? "red" : "green"}
                icon={(
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M9 7h6M9 11h6M9 15h3" />
                  </svg>
                )}
                title={d.device_name || d.id.slice(0, 8)}
                description={(
                  <span className="miniapp-tnum">
                    {isRevoked ? "Revoked" : "Active"} · Issued {formatIssuedAt(d.issued_at)}
                  </span>
                )}
                trailing={!isRevoked ? (
                  <MissionSecondaryButton className="device-row-action" onClick={() => setRevokeId(d.id)}>
                    Revoke
                  </MissionSecondaryButton>
                ) : (
                  <MissionChip tone="red">Revoked</MissionChip>
                )}
              />
            );
          })}
        </div>

        {!data?.devices?.length && (
          <MissionCard tone="blue" className="module-card">
            <MissionModuleHead
              label="No devices yet"
              chip={<MissionChip tone="neutral">Empty</MissionChip>}
            />
            <p className="op-desc type-body-sm">Tap Add device above to get your VPN config for AmneziaVPN.</p>
          </MissionCard>
        )}
      </div>

      <ConfirmModal
        open={revokeId !== null}
        onClose={() => !revokeMutation.isPending && setRevokeId(null)}
        onConfirm={() => revokeMutation.mutate()}
        title="Revoke device?"
        message="Revoking a device stops its VPN config from working. You can issue a new device later if needed."
        confirmLabel="Revoke device"
        cancelLabel="Cancel"
        variant="danger"
        loading={revokeMutation.isPending}
      />
    </PageFrame>
  );
}
