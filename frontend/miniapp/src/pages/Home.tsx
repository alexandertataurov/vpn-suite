import { useNavigate } from "react-router-dom";
import {
  IconBox,
  IconChevronRight,
  IconMonitor,
  IconPlus,
  IconUsers,
} from "@/design-system/icons";
import {
  Badge,
  FallbackScreen,
  FooterHelp,
  ListCard,
  ListRow,
  NewUserHero,
  NoDeviceCallout,
  PillChip,
  PlanCard,
  RenewalBanner,
  Skeleton,
  PageScaffold,
  PageLayout,
  ModernHeader,
} from "@/design-system";
import { SessionMissing } from "@/components";
import { useWebappToken } from "@/api/client";
import { useSession } from "@/hooks";
import { useI18n } from "@/hooks";
import { useAccessHomePageModel } from "@/page-models";

function InviteFriendsCard({ t }: { t: (k: string) => string }) {
  const navigate = useNavigate();
  return (
    <ListCard className="home-card-row home-invite-card">
      <ListRow
        icon={<IconUsers size={15} strokeWidth={2} />}
        iconTone="neutral"
        title={t("home.invite_friends_title")}
        subtitle={t("home.invite_friends_subtitle")}
        right={
          <div className="home-row-right-group">
            <IconChevronRight size={13} strokeWidth={2.5} />
          </div>
        }
        onClick={() => navigate("/support")}
      />
    </ListCard>
  );
}

export function HomePage() {
  const { t } = useI18n();
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
        <PageLayout scrollable={false}>
          <ModernHeader title={t("home.app_title")} />
          <Skeleton variant="card" height={180} />
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={72} />
          <FooterHelp
            note={t("footer.having_trouble")}
            linkLabel={t("footer.view_setup_guide")}
            onLinkClick={() => navigate("/support")}
          />
        </PageLayout>
      </PageScaffold>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title}
        message={model.pageState.message}
        onRetry={model.onRetry}
        retryLabel={t("common.retry")}
      />
    );
  }

  const status = model.status;
  const isGenerating = status === "generating_config";

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
      <ModernHeader
        displayName={profileName}
        avatarUrl={profilePhotoUrl}
        avatarInitial={profileInitial}
        pillChip={
          model.pillChip ? (
            <PillChip variant={model.pillChip.variant}>{model.pillChip.label}</PillChip>
          ) : undefined
        }
        showSettings
      />

      {model.showNewUserHero ? (
        <>
          <NewUserHero
            title={t("home.setup_required_title")}
            description={t("home.setup_required_description")}
            onChoosePlan={() => navigate("/plan")}
            onViewGuide={() => navigate("/support")}
            choosePlanLabel={t("home.choose_plan_cta")}
            viewGuideLabel={t("home.view_guide_label")}
          />
          <ListCard className="home-card-row">
            <ListRow
              icon={<IconMonitor size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={t("home.primary_manage_devices")}
              subtitle={t("home.devices_none_added")}
              right={
                <div className="home-row-right-group">
                  <IconChevronRight size={13} strokeWidth={2.5} />
                </div>
              }
              onClick={() => navigate("/devices")}
            />
          </ListCard>
          <InviteFriendsCard t={t} />
        </>
      ) : model.showPlanHero && model.planHeroData ? (
        <>
          <PlanCard
            plan={model.planHeroData.planName}
            planSub={model.planHeroData.subtitle}
            eyebrow={model.planHeroData.eyebrow}
            status={model.planHeroData.status}
            stats={[...model.planHeroData.stats]}
          />
          {model.showNoDeviceCalloutAboveBanner && (
            <NoDeviceCallout
              title={t("home.no_devices_title")}
              subtitle={t("home.no_devices_subtitle")}
              ctaLabel={t("home.add_device_cta")}
              ctaIcon={<IconPlus size={13} strokeWidth={2} />}
              onAddDevice={() => navigate("/devices")}
            />
          )}
          {model.showRenewalBanner && (
            <RenewalBanner
              variant={model.planHeroData.status === "expired" ? "expired" : "expiring"}
              title={
                status === "expired"
                  ? t("home.renewal_expired_title")
                  : t("home.renewal_expiring_title")
              }
              subtitle={
                status === "expired"
                  ? t("home.renewal_expired_subtitle")
                  : t("home.renewal_expiring_subtitle")
              }
              onClick={() => navigate(status === "expired" ? "/restore-access" : "/plan")}
            />
          )}
          {model.showNoDeviceCallout && !model.showNoDeviceCalloutAboveBanner && (
            <NoDeviceCallout
              title={t("home.no_devices_title")}
              subtitle={t("home.no_devices_subtitle")}
              ctaLabel={t("home.add_device_cta")}
              ctaIcon={<IconPlus size={13} strokeWidth={2} />}
              onAddDevice={() => navigate("/devices")}
            />
          )}
          {!isGenerating && (
            <>
              {(model.showDevices || model.showExpiry || model.showNoDeviceCallout) && (
                <ListCard className="home-card-row">
                  {model.showDevices && !model.showNoDeviceCallout && (
                    <ListRow
                      icon={<IconMonitor size={15} strokeWidth={2} />}
                      iconTone="neutral"
                      title={t("home.manage_devices")}
                      subtitle={model.devicesSubtitle}
                      right={
                        <div className="home-row-right-group">
                          {model.devicesFull && (
                            <Badge label="Full" variant="muted" />
                          )}
                          <IconChevronRight size={13} strokeWidth={2.5} />
                        </div>
                      }
                      onClick={() => navigate("/devices")}
                    />
                  )}
                  {(model.showExpiry || model.showNoDeviceCallout) && (
                    <ListRow
                      icon={<IconBox size={15} strokeWidth={2} />}
                      iconTone="neutral"
                      title={model.subscriptionLabel}
                      subtitle={model.subscriptionSubtitle}
                      right={
                        <div className="home-row-right-group">
                          {model.daysLeft != null &&
                            model.daysLeft > 0 &&
                            model.daysLeft <= 14 && (
                              <Badge label={`${model.daysLeft}d left`} variant="warning" />
                            )}
                          {status === "expired" && (
                            <Badge label="Renew" variant="error" />
                          )}
                          <IconChevronRight size={13} strokeWidth={2.5} />
                        </div>
                      }
                      onClick={() =>
                        navigate(status === "expired" ? "/restore-access" : "/plan")
                      }
                    />
                  )}
                </ListCard>
              )}
              <InviteFriendsCard t={t} />
            </>
          )}
        </>
      ) : null}

      <FooterHelp
        note={t("footer.having_trouble")}
        linkLabel={t("footer.view_setup_guide")}
        onLinkClick={() => navigate("/support")}
      />
      </PageLayout>
    </PageScaffold>
  );
}

export default HomePage;
