import { useNavigate } from "react-router-dom";
import {
  IconBox,
  IconChevronRight,
  IconMonitor,
  IconPlus,
  IconUsers,
} from "@/design-system/icons";
import {
  Button,
  FallbackScreen,
  FooterHelp,
  ListCard,
  ListRow,
  NewUserHero,
  NoDeviceCallout,
  PillChip,
  PlanHeroCard,
  RenewalBanner,
  Skeleton,
  PageScaffold,
  ModernHeader,
} from "@/design-system";
import { SessionMissing } from "@/components";
import { useWebappToken } from "@/api/client";
import { useSession } from "@/hooks";
import { useAccessHomePageModel } from "@/page-models";

function InviteFriendsCard() {
  const navigate = useNavigate();
  return (
    <ListCard className="home-card-row home-invite-card">
      <ListRow
        icon={<IconUsers size={15} strokeWidth={2} />}
        iconTone="neutral"
        title="Invite Friends"
        subtitle="Invite a friend, get +30 days free"
        right={
          <div className="home-row-right-group">
            <IconChevronRight size={13} strokeWidth={2} />
          </div>
        }
        onClick={() => navigate("/support")}
      />
    </ListCard>
  );
}

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
        <ModernHeader title="Amnezia" />
        <Skeleton variant="card" height={180} />
        <Skeleton variant="card" height={120} />
        <Skeleton variant="card" height={72} />
        <FooterHelp
          note="Having trouble?"
          linkLabel="View setup guide"
          onLinkClick={() => navigate("/support")}
        />
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

  const status = model.status;
  const isGenerating = status === "generating_config";

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
        showSettings
      />

      {model.showNewUserHero ? (
        <>
          <NewUserHero
            title="Setup Required"
            description="Choose a plan and add a device to get your secure configuration."
            primaryAction={
              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="new-user-hero-cta"
                onClick={() => navigate("/plan")}
              >
                Choose a Plan →
              </Button>
            }
            secondaryAction={
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => navigate("/support")}
              >
                View setup guide
              </Button>
            }
          />
          <ListCard className="home-card-row">
            <ListRow
              icon={<IconMonitor size={15} strokeWidth={2} />}
              iconTone="neutral"
              title="Devices"
              subtitle="None added yet"
              right={
                <div className="home-row-right-group">
                  <IconChevronRight size={13} strokeWidth={2} />
                </div>
              }
              onClick={() => navigate("/devices")}
            />
          </ListCard>
          <InviteFriendsCard />
        </>
      ) : model.showPlanHero && model.planHeroData ? (
        <>
          <PlanHeroCard
            eyebrow={model.planHeroData.eyebrow}
            planName={model.planHeroData.planName}
            subtitle={model.planHeroData.subtitle}
            status={model.planHeroData.status}
            stats={[...model.planHeroData.stats]}
          />
          {model.showNoDeviceCalloutAboveBanner && (
            <NoDeviceCallout
              title="No devices added"
              subtitle="Add a device to generate your configuration."
              ctaLabel="Add Device"
              ctaIcon={<IconPlus size={13} strokeWidth={2} />}
              onCtaClick={() => navigate("/devices")}
            />
          )}
          {model.showRenewalBanner && (
            <RenewalBanner
              variant={model.planHeroData.status === "expired" ? "expired" : "expiring"}
              title={
                status === "expired"
                  ? "Subscription expired"
                  : "Subscription expiring soon"
              }
              subtitle={
                status === "expired"
                  ? "Renew now to restore access on all devices."
                  : "Renew before it expires to keep access on all devices."
              }
              onClick={() => navigate(status === "expired" ? "/restore-access" : "/plan")}
            />
          )}
          {model.showNoDeviceCallout && !model.showNoDeviceCalloutAboveBanner && (
            <NoDeviceCallout
              title="No devices added"
              subtitle="Add a device to generate your configuration."
              ctaLabel="Add Device"
              ctaIcon={<IconPlus size={13} strokeWidth={2} />}
              onCtaClick={() => navigate("/devices")}
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
                      title="Manage Devices"
                      subtitle={model.devicesSubtitle}
                      right={
                        <div className="home-row-right-group">
                          {model.devicesFull && (
                            <span className="home-row-badge home-row-badge--full">
                              Full
                            </span>
                          )}
                          <IconChevronRight size={13} strokeWidth={2} />
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
                              <span className="home-row-badge home-row-badge--amber">
                                {model.daysLeft}d left
                              </span>
                            )}
                          {status === "expired" && (
                            <span className="home-row-badge home-row-badge--red">
                              Renew
                            </span>
                          )}
                          <IconChevronRight size={13} strokeWidth={2} />
                        </div>
                      }
                      onClick={() =>
                        navigate(status === "expired" ? "/restore-access" : "/plan")
                      }
                    />
                  )}
                </ListCard>
              )}
              <InviteFriendsCard />
            </>
          )}
        </>
      ) : null}

      <FooterHelp
        note="Having trouble?"
        linkLabel="View setup guide"
        onLinkClick={() => navigate("/support")}
      />
    </PageScaffold>
  );
}

export default HomePage;
