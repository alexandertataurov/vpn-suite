import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOpenLink, useSession } from "@/hooks";
import { useWebappToken } from "@/api/client";
import {
  Button,
  CardRow,
  CompactStepper,
  InlineAlert,
  PageHeader,
  PageLayout,
  PageScaffold,
  PageSection,
  RowItem,
  SectionLabel,
  Stack,
} from "@/design-system";
import { IconDownload, IconExternalLink, IconSmartphone } from "@/design-system/icons";
import { AMNEZIA_VPN_ANDROID_URL, AMNEZIA_VPN_IOS_URL } from "@/lib";
import { useI18n } from "@/hooks/useI18n";

type GuidePlatform = "ios" | "android";

export function SetupGuidePage() {
  const navigate = useNavigate();
  const { openLink } = useOpenLink();
  const { t } = useI18n();
  const [platform, setPlatform] = useState<GuidePlatform>("ios");
  const hasToken = !!useWebappToken();
  const session = useSession(hasToken).data;

  const launchPayload = session?.latest_device_delivery?.amnezia_vpn_key ?? null;
  const isReadyToDownloadConfig = Boolean(launchPayload);

  const steps = useMemo(() => {
    if (platform === "ios") {
      return [
        {
          id: "ios-1",
          label: t("guide.ios.step_1_title"),
          description: t("guide.ios.step_1_desc"),
          state: "current" as const,
        },
        {
          id: "ios-2",
          label: t("guide.ios.step_2_title"),
          description: t("guide.ios.step_2_desc"),
          state: "upcoming" as const,
        },
        {
          id: "ios-3",
          label: t("guide.ios.step_3_title"),
          description: t("guide.ios.step_3_desc"),
          state: "upcoming" as const,
        },
        {
          id: "ios-4",
          label: t("guide.ios.step_4_title"),
          description: t("guide.ios.step_4_desc"),
          state: "upcoming" as const,
        },
      ];
    }

    return [
      {
        id: "android-1",
        label: t("guide.android.step_1_title"),
        description: t("guide.android.step_1_desc"),
        state: "current" as const,
      },
      {
        id: "android-2",
        label: t("guide.android.step_2_title"),
        description: t("guide.android.step_2_desc"),
        state: "upcoming" as const,
      },
      {
        id: "android-3",
        label: t("guide.android.step_3_title"),
        description: t("guide.android.step_3_desc"),
        state: "upcoming" as const,
      },
      {
        id: "android-4",
        label: t("guide.android.step_4_title"),
        description: t("guide.android.step_4_desc"),
        state: "upcoming" as const,
      },
    ];
  }, [platform, t]);

  const handleOpenStore = () => {
    openLink(platform === "ios" ? AMNEZIA_VPN_IOS_URL : AMNEZIA_VPN_ANDROID_URL);
  };

  const handleDownloadConfig = () => {
    if (launchPayload) {
      openLink(launchPayload);
      return;
    }
    navigate("/devices");
  };

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
        <PageHeader
          title={t("guide.header_title")}
          subtitle={t("guide.header_subtitle")}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />

        <Stack gap="2">
          <InlineAlert
            variant="info"
            label={t("guide.quick_title")}
            message={t("guide.quick_subtitle")}
          />

          <SectionLabel label={t("guide.platform_label")} />
          <div className="setup-guide-tabs">
            <Button
              variant={platform === "ios" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPlatform("ios")}
              fullWidth
            >
              {t("guide.platform_ios")}
            </Button>
            <Button
              variant={platform === "android" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPlatform("android")}
              fullWidth
            >
              {t("guide.platform_android")}
            </Button>
          </div>

          <PageSection
            title={platform === "ios" ? t("guide.ios.title") : t("guide.android.title")}
            description={platform === "ios" ? t("guide.ios.subtitle") : t("guide.android.subtitle")}
          >
            <CompactStepper items={steps} />
            <div className="setup-guide-chip-row">
              <span className="setup-guide-chip">
                {platform === "ios" ? t("guide.ios.file_chip") : t("guide.android.file_chip")}
              </span>
            </div>
          </PageSection>

          <SectionLabel label={t("guide.no_app_title")} />
          <CardRow>
            <RowItem
              icon={<IconSmartphone size={15} strokeWidth={2} aria-hidden />}
              iconVariant="neutral"
              label={t("guide.no_app_title")}
              subtitle={t("guide.no_app_subtitle")}
              onClick={handleOpenStore}
              right={<IconExternalLink size={14} aria-hidden />}
            />
          </CardRow>

          <InlineAlert
            variant="warning"
            label={t("guide.security_title")}
            message={t("guide.security_body")}
          />

          <Button
            variant="primary"
            fullWidth
            onClick={handleDownloadConfig}
            endIcon={<IconDownload size={16} />}
          >
            {isReadyToDownloadConfig
              ? t("guide.download_cta")
              : t("guide.download_cta_fallback")}
          </Button>
        </Stack>
      </PageLayout>
    </PageScaffold>
  );
}
