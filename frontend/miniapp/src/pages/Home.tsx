import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import { PageFrame } from "@/design-system/layouts/PageFrame";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import {
  HomeDynamicBlock,
  HomeHeroPanel,
  HomeQuickActionGrid,
  HomePrimaryActionZone,
} from "@/design-system";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useHomePageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function HomePage() {
  const model = useHomePageModel();
  const { track } = useTelemetry(model.planId);
  const { t } = useI18n();
  const navigate = useNavigate();

  const upsellShown = model.primaryUpsell?.show && model.primaryUpsell.targetTo;
  useEffect(() => {
    if (upsellShown && model.primaryUpsell) {
      track("upsell_impression", { trigger: model.primaryUpsell.trigger, screen_name: "home" });
    }
  }, [upsellShown, model.primaryUpsell, track]);

  const heroHandlers = useMemo(() => {
    const variant = model.homeHero.variant;
    const isHeroInteractive = variant !== "loading" && variant !== "onboarding";
    const canSelectServer = model.hasSubscription && !model.homeHero.isServerLoading;
    return {
      onHeroPress: isHeroInteractive ? () => navigate("/connect-status") : undefined,
      onServerSelect: canSelectServer ? () => navigate("/servers") : undefined,
    };
  }, [model.hasSubscription, model.homeHero.isServerLoading, model.homeHero.variant, navigate]);

  const quickActionDisabled = useMemo(() => {
    const unavailable =
      model.hasSubscription &&
      model.quickActionContext.status === "connecting" &&
      model.quickActionContext.deviceCount === 0;
    return unavailable ? { download_config: t("home.download_config_loading_unavailable") } : undefined;
  }, [model.hasSubscription, model.quickActionContext.deviceCount, model.quickActionContext.status, t]);

  const primaryActionZoneProps = useMemo(
    () => ({
      state: model.primaryActionState,
      isLoading: model.pageState.status === "loading" || model.homePhase === "loading" || model.isHomeTransitioning,
      loadingLabel:
        model.homePhase === "error"
          ? t("home.retrying_label")
          : model.homePhase === "connecting" || model.isHomeTransitioning
            ? t("home.connecting_label")
            : t("home.loading_label"),
      planTo: model.primaryActionState === "no_plan" ? model.primaryAction.to : "/plan",
      connectTo: model.primaryActionState === "disconnected" ? model.primaryAction.to : "/connect-status",
      setupTo: model.primaryActionState === "connecting" ? model.primaryAction.to : "/connect-status",
      devicesTo: model.primaryActionState === "connected" ? model.primaryAction.to : "/devices",
      serverTo: "/servers",
      supportTo: model.primaryAction.secondaryTo,
    }),
    [
      model.primaryAction,
      model.primaryActionState,
      model.pageState.status,
      model.homePhase,
      model.isHomeTransitioning,
      t,
    ],
  );

  const dynamicBlockProps = useMemo(
    () => ({
      ...model.homeSignals,
      renewalTargetTo: model.primaryUpsell?.show && model.primaryUpsell.targetTo ? model.primaryUpsell.targetTo : "/plan",
      upgradeTargetTo: model.primaryUpsell?.show && model.primaryUpsell.targetTo ? model.primaryUpsell.targetTo : "/plan",
    }),
    [model.homeSignals, model.primaryUpsell],
  );

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_account_status")}
        message={model.pageState.message ?? t("common.could_not_load_account_status")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  return (
    <PageFrame
      title={model.header.title}
      subtitle={model.header.subtitle}
      className="page-shell--default page-shell--sectioned page-shell--centered"
    >
      <div className="page-stack--home">
        <HomeHeroPanel
          {...model.homeHero}
          onServerSelect={heroHandlers.onServerSelect}
          onHeroPress={heroHandlers.onHeroPress}
        />
        <HomePrimaryActionZone {...primaryActionZoneProps} />
        <HomeDynamicBlock {...dynamicBlockProps} />
        <HomeQuickActionGrid
          hasSub={model.hasSubscription}
          status={model.quickActionContext.status}
          deviceCount={model.quickActionContext.deviceCount}
          planLimit={model.quickActionContext.planLimit}
          planKind={model.quickActionContext.planKind}
          disabledActions={quickActionDisabled}
        />
      </div>
    </PageFrame>
  );
}
