import { useLocation, useNavigate } from "react-router-dom";
import {
  IconBookOpen,
  IconBox,
  IconCreditCard,
  IconMonitor,
  IconPlus,
  IconUsers,
} from "@/design-system/icons";
import {
  Badge,
  FooterHelp,
  CardRow,
  Stack,
  NoDeviceCallout,
  PillChip,
  PlanCard,
  RenewalBanner,
  Skeleton,
  RowItem,
  PageScaffold,
  PageLayout,
  ModernHeader,
} from "@/design-system";
import { NewUserHero } from "@/design-system/recipes";
import { FallbackScreen } from "@/design-system/patterns";
import { SessionMissing } from "@/app/components";
import { useWebappToken } from "@/api/client";
import { getPlategaDonateHref, homeMergedSummaryCardEnabled } from "@/config/env";
import { useSession } from "@/hooks";
import { useOpenLink } from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { useAccessHomePageModel } from "@/features/home/model/useAccessHomePageModel";

function InviteFriendsRow({ t }: { t: (k: string) => string }) {
  const navigate = useNavigate();
  return (
    <RowItem
      icon={<IconUsers size={15} strokeWidth={2} aria-hidden />}
      iconVariant="neutral"
      label={t("home.invite_friends_title")}
      subtitle={t("home.invite_friends_subtitle")}
      onClick={() => navigate("/referral")}
    />
  );
}

function HomePrimaryActions({
  t,
  showDevices,
  showExpiry,
  showNoDeviceCallout,
  devicesSubtitle,
  devicesFull,
  subscriptionLabel,
  subscriptionSubtitle,
  status,
  daysLeft,
}: {
  t: (k: string, params?: Record<string, string | number | boolean>) => string;
  showDevices: boolean;
  showExpiry: boolean;
  showNoDeviceCallout: boolean;
  devicesSubtitle: string;
  devicesFull: boolean;
  subscriptionLabel: string;
  subscriptionSubtitle: string;
  status: string;
  daysLeft: number | null;
}) {
  const navigate = useNavigate();
  const showDeviceRow = showDevices && !showNoDeviceCallout;
  const showSubscriptionRow = showExpiry || showNoDeviceCallout;

  return (
    <CardRow className="home-card-row home-quick-actions">
      {showDeviceRow ? (
        <RowItem
          icon={<IconMonitor size={15} strokeWidth={2} aria-hidden />}
          iconVariant="neutral"
          label={t("home.manage_devices")}
          subtitle={devicesSubtitle}
          right={devicesFull ? <Badge label={t("home.badge_full")} variant="muted" /> : undefined}
          onClick={() => navigate("/devices")}
        />
      ) : null}
      {showSubscriptionRow ? (
        <RowItem
          icon={<IconBox size={15} strokeWidth={2} aria-hidden />}
          iconVariant="neutral"
          label={subscriptionLabel}
          subtitle={subscriptionSubtitle}
          right={
            <>
              {daysLeft != null && daysLeft > 0 && daysLeft <= 14 ? (
                <Badge label={t("home.badge_days_left", { count: daysLeft })} variant="warning" />
              ) : null}
              {status === "expired" ? <Badge label={t("home.badge_renew")} variant="error" /> : null}
            </>
          }
          onClick={() => navigate(status === "expired" ? "/restore-access" : "/plan")}
        />
      ) : null}
    </CardRow>
  );
}

function HomeMergedSummaryAction({
  t,
  devicesSubtitle,
  subscriptionSubtitle,
  showDevices,
  showExpiry,
  showNoDeviceCallout,
  status,
  daysLeft,
  devicesFull,
}: {
  t: (k: string, params?: Record<string, string | number | boolean>) => string;
  devicesSubtitle: string;
  subscriptionSubtitle: string;
  showDevices: boolean;
  showExpiry: boolean;
  showNoDeviceCallout: boolean;
  status: string;
  daysLeft: number | null;
  devicesFull: boolean;
}) {
  const navigate = useNavigate();
  const showMerged = (showDevices && !showNoDeviceCallout) || showExpiry || showNoDeviceCallout;
  if (!showMerged) return null;
  return (
    <CardRow className="home-card-row home-quick-actions">
      <RowItem
        icon={<IconMonitor size={15} strokeWidth={2} aria-hidden />}
        iconVariant="neutral"
        label={t("home.devices_subscription_title")}
        subtitle={(
          <span className="home-merged-subtitle">
            <span className="home-merged-subtitle-line">{devicesSubtitle}</span>
            <span className="home-merged-subtitle-line">{subscriptionSubtitle}</span>
          </span>
        )}
        subtitleClassName="home-merged-subtitle-wrap"
        right={(
          <>
            {devicesFull ? <Badge label={t("home.badge_full")} variant="muted" /> : null}
            {daysLeft != null && daysLeft > 0 && daysLeft <= 14 ? (
              <Badge label={t("home.badge_days_left", { count: daysLeft })} variant="warning" />
            ) : null}
            {status === "expired" ? <Badge label={t("home.badge_renew")} variant="error" /> : null}
          </>
        )}
        onClick={() => navigate(status === "expired" ? "/restore-access" : "/devices")}
      />
    </CardRow>
  );
}

function HomeStatusRail({
  t,
  status,
  showNoDeviceCalloutAboveBanner,
  showRenewalBanner,
  showNoDeviceCallout,
  uiConfigTitle,
  uiConfigDescription,
  onAddDevice,
  onRenewalClick,
}: {
  t: (k: string) => string;
  status: string;
  showNoDeviceCalloutAboveBanner: boolean;
  showRenewalBanner: boolean;
  showNoDeviceCallout: boolean;
  uiConfigTitle: string;
  uiConfigDescription: string;
  onAddDevice: () => void;
  onRenewalClick: () => void;
}) {
  return (
    <>
      {status === "generating_config" ? (
        <CardRow className="home-card-row home-status-card">
          <RowItem
            icon={<IconBox size={15} strokeWidth={2} aria-hidden />}
            iconVariant="neutral"
            label={uiConfigTitle}
            subtitle={uiConfigDescription}
            right={<Badge label={t("home.loading_label")} variant="muted" />}
            showChevron={false}
          />
        </CardRow>
      ) : null}
      {showNoDeviceCalloutAboveBanner ? (
        <NoDeviceCallout
          title={t("home.no_devices_title")}
          subtitle={t("home.no_devices_subtitle")}
          ctaLabel={t("home.add_device_cta")}
          ctaIcon={<IconPlus size={13} strokeWidth={2} />}
          onAddDevice={onAddDevice}
        />
      ) : null}
      {showRenewalBanner ? (
        <RenewalBanner
          variant={status === "expired" ? "expired" : "expiring"}
          title={status === "expired" ? t("home.renewal_expired_title") : t("home.renewal_expiring_title")}
          subtitle={status === "expired" ? t("home.renewal_expired_subtitle") : t("home.renewal_expiring_subtitle")}
          className="home-renewal-banner"
          onClick={onRenewalClick}
        />
      ) : null}
      {showNoDeviceCallout && !showNoDeviceCalloutAboveBanner ? (
        <NoDeviceCallout
          title={t("home.no_devices_title")}
          subtitle={t("home.no_devices_subtitle")}
          ctaLabel={t("home.add_device_cta")}
          ctaIcon={<IconPlus size={13} strokeWidth={2} />}
          onAddDevice={onAddDevice}
        />
      ) : null}
    </>
  );
}

function HomeInfoActions({
  t,
  onOpenGuide,
  onDonate,
  canDonate,
}: {
  t: (k: string) => string;
  onOpenGuide: () => void;
  onDonate: () => void;
  canDonate: boolean;
}) {
  return (
    <CardRow className="home-card-row home-info-card">
      <RowItem
        icon={<IconBookOpen size={15} strokeWidth={2} aria-hidden />}
        iconVariant="neutral"
        label={t("home.main_instruction_title")}
        subtitle={t("home.main_instruction_subtitle")}
        onClick={onOpenGuide}
      />
      <RowItem
        icon={<IconCreditCard size={15} strokeWidth={2} aria-hidden />}
        iconVariant="neutral"
        label={t("home.donate_platega_title")}
        subtitle={t("home.donate_platega_subtitle")}
        onClick={canDonate ? onDonate : undefined}
        showChevron={canDonate}
      />
    </CardRow>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const model = useAccessHomePageModel();
  const location = useLocation();
  const navigate = useNavigate();
  const { openLink } = useOpenLink();
  const hasToken = !!useWebappToken();
  const session = useSession(hasToken).data;
  const donateHref = getPlategaDonateHref();
  const profileName = (session?.user?.display_name ?? "").trim() || t("home.guest_name");
  const profileInitial =
    (session?.user?.display_name ?? "").trim().length > 0
      ? profileName.charAt(0).toUpperCase()
      : t("home.guest_initial").charAt(0).toUpperCase();
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
            onLinkClick={() => navigate("/setup-guide")}
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
  const handleAddDevice = () => navigate("/devices");
  const handleRenewalClick = () => navigate(status === "expired" ? "/restore-access" : "/plan");
  const handleGuideOpen = () => navigate("/setup-guide");
  const handleDonateOpen = () => {
    if (donateHref) openLink(donateHref);
  };
  const mergedByQuery = new URLSearchParams(location.search).get("homeMergedCard") === "1";
  const useMergedSummaryCard = homeMergedSummaryCardEnabled || mergedByQuery;

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

        <Stack gap="2" className="home-content-stack">
          {model.showNewUserHero ? (
            <>
              <NewUserHero
                title={t("home.setup_required_title")}
                description={t("home.setup_required_description")}
                onChoosePlan={() => navigate("/plan")}
                onViewGuide={() => navigate("/setup-guide")}
                choosePlanLabel={t("home.choose_plan_cta")}
                viewGuideLabel={t("home.view_guide_label")}
              />
              <HomePrimaryActions
                t={t}
                showDevices={true}
                showExpiry={false}
                showNoDeviceCallout={false}
                devicesSubtitle={t("home.devices_none_added")}
                devicesFull={false}
                subscriptionLabel=""
                subscriptionSubtitle=""
                status={status}
                daysLeft={null}
              />
              <CardRow className="home-card-row home-invite-card">
                <InviteFriendsRow t={t} />
              </CardRow>
            </>
          ) : model.showPlanHero && model.planHeroData ? (
            <>
              <PlanCard
                plan={model.planHeroData.planName}
                planSub={model.planHeroData.subtitle ?? ""}
                eyebrow={model.planHeroData.eyebrow}
                status={model.planHeroData.status}
                stats={[...model.planHeroData.stats]}
              />
              <HomeStatusRail
                t={t}
                status={status}
                showNoDeviceCalloutAboveBanner={model.showNoDeviceCalloutAboveBanner}
                showRenewalBanner={model.showRenewalBanner}
                showNoDeviceCallout={model.showNoDeviceCallout}
                uiConfigTitle={model.uiConfig?.title ?? t("home.access_state_generating_title")}
                uiConfigDescription={model.uiConfig?.description ?? t("home.access_state_generating_desc")}
                onAddDevice={handleAddDevice}
                onRenewalClick={handleRenewalClick}
              />
              {!isGenerating ? (
                <>
                  {useMergedSummaryCard ? (
                    <HomeMergedSummaryAction
                      t={t}
                      showDevices={model.showDevices}
                      showExpiry={model.showExpiry}
                      showNoDeviceCallout={model.showNoDeviceCallout}
                      devicesSubtitle={model.devicesSubtitle}
                      subscriptionSubtitle={model.subscriptionSubtitle}
                      status={status}
                      daysLeft={model.daysLeft}
                      devicesFull={model.devicesFull}
                    />
                  ) : (
                    <HomePrimaryActions
                      t={t}
                      showDevices={model.showDevices}
                      showExpiry={model.showExpiry}
                      showNoDeviceCallout={model.showNoDeviceCallout}
                      devicesSubtitle={model.devicesSubtitle}
                      devicesFull={model.devicesFull}
                      subscriptionLabel={model.subscriptionLabel}
                      subscriptionSubtitle={model.subscriptionSubtitle}
                      status={status}
                      daysLeft={model.daysLeft}
                    />
                  )}
                  <CardRow className="home-card-row home-invite-card">
                    <InviteFriendsRow t={t} />
                  </CardRow>
                </>
              ) : null}
            </>
          ) : null}

          <HomeInfoActions
            t={t}
            onOpenGuide={handleGuideOpen}
            onDonate={handleDonateOpen}
            canDonate={Boolean(donateHref)}
          />

          <FooterHelp
            note={t("footer.having_trouble")}
            linkLabel={t("footer.view_setup_guide")}
            onLinkClick={() => navigate("/setup-guide")}
          />
        </Stack>
      </PageLayout>
    </PageScaffold>
  );
}

export default HomePage;
