import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ConnectionStatusHero, SessionMissing, LimitStrip } from "@/components";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import {
  PageFrame,
  PageSection,
  Skeleton,
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
  const upsellShown = model.primaryUpsell?.show && model.primaryUpsell.targetTo;
  useEffect(() => {
    if (upsellShown && model.primaryUpsell) {
      track("upsell_impression", { trigger: model.primaryUpsell.trigger, screen_name: "home" });
    }
  }, [upsellShown, model.primaryUpsell, track]);

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

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="home-page">
        <PageSection title={t("home.quick_access_title_with_sub")} className="stagger-1">
          <Skeleton variant="card" className="stagger-2" />
        </PageSection>
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="home-page">
      <ConnectionStatusHero {...model.connectionHero} />
      {model.primaryUpsell?.show && model.primaryUpsell.targetTo ? (
        <div className="stagger-2">
          <LimitStrip
            variant="compact"
            title={model.primaryUpsell.title}
            message={model.primaryUpsell.body}
            action={
              <Link
                to={model.primaryUpsell.targetTo}
                onClick={() =>
                  track("upsell_clicked", { trigger: model.primaryUpsell!.trigger, screen_name: "home" })
                }
                className="page-anchor-link"
              >
                {model.primaryUpsell.ctaLabel}
              </Link>
            }
            className="home-upsell-row"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3 8.5 6.5 12 13 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>
      ) : null}
      <div className="stagger-2">
        <HomePrimaryActionZone
          phase={model.connectionHero.state}
          primaryTo={model.primaryAction.to}
          primaryLabel={model.primaryAction.label}
          secondaryLabel={model.primaryAction.secondaryLabel}
          secondaryTo={model.primaryAction.secondaryTo}
        />
      </div>
      <PageSection
        title={model.hasSubscription ? t("home.quick_access_title_with_sub") : t("home.quick_actions_title")}
        description={model.quickAccessMeta.description}
        className="stagger-2"
      >
        <HomeQuickActionGrid hasSub={model.hasSubscription} />
      </PageSection>
    </PageFrame>
  );
}
