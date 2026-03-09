import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ConnectionStatusHero, SessionMissing } from "@/components";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import {
  PageFrame,
  PageSection,
  Skeleton,
  MissionChip,
  HomeQuickActionGrid,
  HomePrimaryActionZone,
} from "@/design-system";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useHomePageModel } from "@/page-models";

export function HomePage() {
  const model = useHomePageModel();
  const { track } = useTelemetry(model.planId);
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
        title={model.pageState.title ?? "Could not load account status"}
        message={model.pageState.message ?? "Could not load account status"}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="home-page">
        <PageSection title="Quick Access" className="stagger-1">
          <Skeleton variant="card" className="stagger-2" />
        </PageSection>
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} className="home-page">
      <ConnectionStatusHero {...model.connectionHero} />
      {!model.hasSubscription ? (
        <div className="stagger-2">
          <HomePrimaryActionZone
            phase="inactive"
            primaryTo="/plan"
            primaryLabel="Get a plan"
            secondaryLabel="Learn support flow"
            secondaryTo="/support"
          />
        </div>
      ) : model.primaryUpsell?.show && model.primaryUpsell.targetTo ? (
        <div className="stagger-2">
          <div className="limit-strip limit-strip--compact home-upsell-row">
            <div className="limit-strip__icon" aria-hidden>
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
            </div>
            <div className="limit-strip__text">
              <div className="limit-strip__title">{model.primaryUpsell.title}</div>
              <div className="limit-strip__message">{model.primaryUpsell.body}</div>
            </div>
            <div className="limit-strip__action">
              <Link
                to={model.primaryUpsell.targetTo}
                onClick={() =>
                  track("upsell_clicked", { trigger: model.primaryUpsell!.trigger, screen_name: "home" })
                }
                className="page-anchor-link"
              >
                {model.primaryUpsell.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <PageSection
        title={
          model.hasSubscription ? (
            <>
              Quick Access{" "}
              <MissionChip
                tone={model.quickAccessMeta.badge.tone}
                className={`section-meta-chip ${model.quickAccessMeta.badge.emphasizeNumeric ? "miniapp-tnum" : ""}`.trim()}
              >
                {model.quickAccessMeta.badge.label}
              </MissionChip>
            </>
          ) : (
            "Quick Access"
          )
        }
        description={model.quickAccessMeta.description}
        className="stagger-2"
      >
        <HomeQuickActionGrid hasSub={model.hasSubscription} />
      </PageSection>
    </PageFrame>
  );
}
