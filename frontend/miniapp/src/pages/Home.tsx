import { useNavigate } from "react-router-dom";
import { IconArrowRight, IconShield, IconAlertTriangle } from "@/design-system/icons";
import {
  ActionCard,
  Button,
  FallbackScreen,
  NewUserHero,
  NoDeviceCallout,
  PillChip,
  PlanHeroCard,
  RenewalBanner,
  Skeleton,
  PageScaffold,
  ModernHeader,
  ModernHeroCard,
} from "@/design-system";
import { SessionMissing } from "@/components";
import { useWebappToken } from "@/api/client";
import { useSession } from "@/hooks";
import { useAccessHomePageModel } from "@/page-models";

export function HomePage() {
  const model = useAccessHomePageModel();
  const navigate = useNavigate();
  const hasToken = !!useWebappToken();
  const session = useSession(hasToken).data;
  const profileName = (session?.user?.display_name ?? "").trim() || "Guest";
  const profileInitial = profileName.charAt(0).toUpperCase() || "G";
  const profilePhotoUrl = (session?.user?.photo_url ?? "").trim() || undefined;

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <ModernHeader title="Amnezia" showSettings={false} />
        <div className="modern-content-pad stagger-1">
          <Skeleton variant="card" height={260} />
          <div className="modern-action-grid u-mt-16">
            <Skeleton variant="card" height={80} />
            <Skeleton variant="card" height={80} />
          </div>
          <Skeleton variant="card" height={72} className="u-mt-16" />
        </div>
      </PageScaffold>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title}
        message={model.pageState.message}
        onRetry={model.onRetry}
        retryLabel="Retry"
      />
    );
  }

  const uiConfig = model.uiConfig;
  const status = model.status;
  const isGenerating = status === "generating_config";
  const heroStatus =
    status === "expired" ? "danger" : status === "ready" ? "active" : "default";

  return (
    <PageScaffold>
      <ModernHeader
        displayName={profileName}
        avatarUrl={profilePhotoUrl}
        avatarInitial={profileInitial}
        pillChip={
          model.pillChip ? (
            <PillChip variant={model.pillChip.variant}>{model.pillChip.label}</PillChip>
          ) : undefined
        }
        showSettings={false}
      />

      {model.showNewUserHero ? (
        <NewUserHero
          title="Setup Required"
          description="Choose a plan to get VPN access. Manage devices and subscription here."
          primaryAction={
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => navigate("/plan")}
              endIcon={<IconArrowRight />}
            >
              Choose a Plan →
            </Button>
          }
        />
      ) : model.showPlanHero && model.planHeroData ? (
        <>
          <PlanHeroCard
            eyebrow={model.planHeroData.eyebrow}
            planName={model.planHeroData.planName}
            subtitle={model.planHeroData.subtitle}
            status={model.planHeroData.status}
            stats={[...model.planHeroData.stats]}
          />
          {model.showRenewalBanner && (
            <RenewalBanner
              variant={model.planHeroData.status === "expired" ? "expired" : "expiring"}
              title={status === "expired" ? "Renew your plan" : "Plan expiring soon"}
              subtitle={
                status === "expired"
                  ? "Renew to keep VPN access"
                  : `Renews ${model.expiryValue}. Renew now to avoid interruption.`
              }
              onClick={() => navigate(status === "expired" ? "/restore-access" : "/plan")}
            />
          )}
          {model.showNoDeviceCallout && (
            <NoDeviceCallout
              title="Add your first device"
              subtitle="Generate a config to import in AmneziaVPN"
              ctaLabel="Add Device"
              onCtaClick={() => navigate("/devices")}
            />
          )}
          {!model.showNoDeviceCallout &&
            !isGenerating &&
            uiConfig &&
            !uiConfig.ctaDisabled && (
              <div className="modern-hero-actions modern-content-pad">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={uiConfig.ctaAction}
                  endIcon={<IconArrowRight />}
                >
                  {uiConfig.ctaLabel}
                </Button>
              </div>
            )}
        </>
      ) : (
        <ModernHeroCard
          status={heroStatus}
          icon={
            status === "expired" ? (
              <IconAlertTriangle size={36} />
            ) : (
              <IconShield size={36} strokeWidth={status === "ready" ? 3 : 2} />
            )
          }
          title={uiConfig?.title ?? ""}
          description={uiConfig?.description ?? ""}
          actions={
            !isGenerating && uiConfig && !uiConfig.ctaDisabled ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={uiConfig.ctaAction}
                endIcon={<IconArrowRight />}
              >
                {uiConfig.ctaLabel}
              </Button>
            ) : null
          }
        />
      )}

      {(model.showDevices || model.showExpiry) && (
        <div className="modern-action-grid">
          {model.showDevices && model.devicesValue ? (
            <ActionCard label="Devices" value={model.devicesValue} onClick={() => navigate("/devices")} />
          ) : null}
          {model.showExpiry && model.expiryValue ? (
            <ActionCard
              label={model.expiryLabel}
              value={model.expiryValue}
              onClick={() => (status === "expired" ? navigate("/restore-access") : navigate("/plan"))}
            />
          ) : null}
        </div>
      )}

      <div className="modern-footer-help">
        <p className="modern-help-note">
          Having trouble?{" "}
          <span className="modern-help-link" onClick={() => navigate("/support")}>
            View setup guide
          </span>
        </p>
      </div>
    </PageScaffold>
  );
}

export default HomePage;
