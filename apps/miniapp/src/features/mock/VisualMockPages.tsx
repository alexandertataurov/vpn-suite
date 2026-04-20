import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import {
  Button,
  CardRow,
  Checkbox,
  CheckoutSummaryCard,
  DevicesSummaryCard,
  FooterHelp,
  InlineAlert,
  Input,
  NewUserHero,
  PageHeader,
  PageLayout,
  PageScaffold,
  PageSection,
  PlanCard,
  RenewalBanner,
  RowItem,
  SectionLabel,
  Select,
  Skeleton,
  SkeletonList,
  Stack,
  Switch,
  Textarea,
} from "@/design-system";
import {
  IconAlertTriangle,
  IconClock,
  IconCreditCard,
  IconInfo,
  IconSettings,
  IconShield,
  IconSmartphone,
  IconUsers,
} from "@/design-system/icons";
import "./visual-mock-pages.css";

type MockKey =
  | "index"
  | "home"
  | "plan"
  | "devices"
  | "settings"
  | "support"
  | "checkout"
  | "onboarding"
  | "setupGuide"
  | "connectStatus"
  | "restoreAccess"
  | "referral"
  | "buttons"
  | "forms"
  | "feedback"
  | "cards"
  | "mirror";

const MOCK_LINKS: ReadonlyArray<{ key: MockKey; label: string; to: string; group: "pages" | "components" | "mirror" }> = [
  { key: "index", label: "Index", to: "/mock", group: "pages" },
  { key: "home", label: "Home", to: "/mock/pages/home", group: "pages" },
  { key: "plan", label: "Plan", to: "/mock/pages/plan", group: "pages" },
  { key: "devices", label: "Devices", to: "/mock/pages/devices", group: "pages" },
  { key: "settings", label: "Settings", to: "/mock/pages/settings", group: "pages" },
  { key: "support", label: "Support", to: "/mock/pages/support", group: "pages" },
  { key: "checkout", label: "Checkout", to: "/mock/pages/checkout", group: "pages" },
  { key: "onboarding", label: "Onboarding", to: "/mock/pages/onboarding", group: "pages" },
  { key: "setupGuide", label: "Setup guide", to: "/mock/pages/setup-guide", group: "pages" },
  { key: "connectStatus", label: "Connect status", to: "/mock/pages/connect-status", group: "pages" },
  { key: "restoreAccess", label: "Restore access", to: "/mock/pages/restore-access", group: "pages" },
  { key: "referral", label: "Referral", to: "/mock/pages/referral", group: "pages" },
  { key: "buttons", label: "Buttons", to: "/mock/components/buttons", group: "components" },
  { key: "forms", label: "Forms", to: "/mock/components/forms", group: "components" },
  { key: "feedback", label: "Feedback", to: "/mock/components/feedback", group: "components" },
  { key: "cards", label: "Cards", to: "/mock/components/cards", group: "components" },
  { key: "mirror", label: "Mirror · Real Pages", to: "/mock/mirror", group: "mirror" },
];

function MockNavigation({ current }: { current: MockKey }) {
  const navigate = useNavigate();
  const pageLinks = MOCK_LINKS.filter((item) => item.group === "pages");
  const componentLinks = MOCK_LINKS.filter((item) => item.group === "components");
  const mirrorLinks = MOCK_LINKS.filter((item) => item.group === "mirror");

  return (
    <Stack gap="2">
      <SectionLabel label="Page Mocks" />
      <div className="mock-nav-grid">
        {pageLinks.map((item) => (
          <Button
            key={item.key}
            variant={current === item.key ? "primary" : "secondary"}
            onClick={() => navigate(item.to)}
            fullWidth
          >
            {item.label}
          </Button>
        ))}
      </div>
      <SectionLabel label="Component Mocks" />
      <div className="mock-nav-grid">
        {componentLinks.map((item) => (
          <Button
            key={item.key}
            variant={current === item.key ? "primary" : "secondary"}
            onClick={() => navigate(item.to)}
            fullWidth
          >
            {item.label}
          </Button>
        ))}
      </div>
      <SectionLabel label="Mirror Mode" />
      <div className="mock-nav-grid">
        {mirrorLinks.map((item) => (
          <Button
            key={item.key}
            variant={current === item.key ? "primary" : "secondary"}
            onClick={() => navigate(item.to)}
            fullWidth
          >
            {item.label}
          </Button>
        ))}
      </div>
    </Stack>
  );
}

function MockFrame({
  title,
  subtitle,
  current,
  screenshotName,
  children,
}: {
  title: string;
  subtitle: string;
  current: MockKey;
  screenshotName: string;
  children: React.ReactNode;
}) {
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPng = async () => {
    if (!captureRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${screenshotName}.png`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
        <div className="mock-capture-root" ref={captureRef}>
          <PageHeader title={title} subtitle={subtitle} />
          <MockNavigation current={current} />
          {children}
        </div>
        <div className="mock-actions-row">
          <Button
            variant="secondary"
            onClick={() => {
              void handleCopyLink();
            }}
          >
            Copy Link
          </Button>
          <Button
            variant="primary"
            transientState={isExporting ? "loading" : "idle"}
            loadingText="Exporting..."
            onClick={() => {
              void handleExportPng();
            }}
          >
            Export PNG
          </Button>
        </div>
      </PageLayout>
    </PageScaffold>
  );
}

export function MockDesignIndexPage() {
  const navigate = useNavigate();
  const surfaces = MOCK_LINKS.filter((item) => item.key !== "index");
  const mirrorRoutes = [
    "/mock/mirror/home",
    "/mock/mirror/onboarding",
    "/mock/mirror/setup-guide",
    "/mock/mirror/plan",
    "/mock/mirror/plan/checkout/pro-annual",
    "/mock/mirror/devices",
    "/mock/mirror/settings",
    "/mock/mirror/support",
    "/mock/mirror/connect-status",
    "/mock/mirror/restore-access",
    "/mock/mirror/referral",
  ];
  const mirrorScenarios = [
    { label: "Default", qs: "" },
    { label: "No Plan", qs: "?scenario=no_plan" },
    { label: "Expired", qs: "?scenario=expired" },
    { label: "No Devices", qs: "?scenario=no_devices" },
    { label: "Device Limit", qs: "?scenario=device_limit" },
    { label: "FAQ Offline", qs: "?scenario=faq_offline" },
  ];

  return (
    <MockFrame
      title="Visual Mock Index"
      subtitle="Full design sandbox for page surfaces and component states."
      current="index"
      screenshotName="mock-index"
    >
      <InlineAlert
        variant="info"
        label="Mock mode"
        message="Use these routes to evaluate hierarchy, spacing, and component consistency before product changes."
      />
      <InlineAlert
        variant="success"
        label="Mirror mode"
        message="`/mock/mirror/*` renders real app pages with mocked API responses."
      />
      <PageSection title="All surfaces" description="Open any mock directly from this matrix.">
        <div className="mock-preview-grid">
          {surfaces.map((surface) => (
            <button key={surface.key} type="button" className="mock-preview-card" onClick={() => navigate(surface.to)}>
              <div className={`mock-preview-screen mock-preview-screen--${surface.group}`} aria-hidden />
              <div className="mock-preview-title">{surface.label}</div>
              <div className="mock-preview-subtitle">{surface.to}</div>
            </button>
          ))}
        </div>
      </PageSection>
      <PageSection title="Mirror routes" description="These links open the real pages in mock-data mode.">
        <div className="mock-preview-grid">
          {mirrorRoutes.map((routePath) => (
            <button
              key={routePath}
              type="button"
              className="mock-preview-card"
              onClick={() => navigate(routePath)}
            >
              <div className="mock-preview-screen mock-preview-screen--mirror" aria-hidden />
              <div className="mock-preview-title">{routePath.replace("/mock/mirror/", "")}</div>
              <div className="mock-preview-subtitle">{routePath}</div>
            </button>
          ))}
        </div>
      </PageSection>
      <PageSection title="Mirror scenarios" description="Open mirror mode with edge-case datasets.">
        <div className="mock-component-grid">
          {mirrorScenarios.map((scenario) => (
            <Button
              key={scenario.label}
              variant="secondary"
              onClick={() => navigate(`/mock/mirror/home${scenario.qs}`)}
              fullWidth
            >
              {scenario.label}
            </Button>
          ))}
        </div>
      </PageSection>
    </MockFrame>
  );
}

export function MockPageHome() {
  return (
    <MockFrame title="Page Mock · Home" subtitle="Hero, summary cards, and primary flow cues." current="home" screenshotName="mock-page-home">
      <NewUserHero
        title="Secure your connection in 60 seconds"
        description="Pick plan, add your first device, and import config in AmneziaVPN."
        onChoosePlan={() => {}}
        onViewGuide={() => {}}
      />
      <PlanCard
        plan="Pro"
        planSub="Monthly"
        eyebrow="Current plan"
        status="active"
        devices={2}
        deviceLimit={5}
        renewsLabel="May 20"
      />
      <RenewalBanner
        variant="expiring"
        title="Subscription expires soon"
        subtitle="Renew now to avoid connection interruption."
        badge="4 days left"
        onClick={() => {}}
      />
    </MockFrame>
  );
}

export function MockPagePlan() {
  return (
    <MockFrame title="Page Mock · Plan" subtitle="Plan comparison and billing hierarchy." current="plan" screenshotName="mock-page-plan">
      <InlineAlert
        variant="success"
        label="Plan active"
        message="Current subscription is healthy. You can still upgrade for more devices."
      />
      <PageSection title="Current subscription">
        <PlanCard
          plan="Starter"
          planSub="30 days"
          status="expiring"
          devices={1}
          deviceLimit={1}
          renewsLabel="In 3 days"
        />
      </PageSection>
      <PageSection title="Available upgrades">
        <Stack gap="2">
          <Button variant="primary" fullWidth>
            Upgrade to Plus
          </Button>
          <Button variant="secondary" fullWidth>
            Compare all plans
          </Button>
        </Stack>
      </PageSection>
    </MockFrame>
  );
}

export function MockPageDevices() {
  return (
    <MockFrame title="Page Mock · Devices" subtitle="Device management metrics and list rows." current="devices" screenshotName="mock-page-devices">
      <DevicesSummaryCard
        title="Devices"
        description="Manage configs and monitor usage health."
        metrics={[
          { keyLabel: "Capacity", valueLabel: "2 / 5 active", percent: 40, tone: "healthy", showProgress: true },
          { keyLabel: "Setup", valueLabel: "1 pending", percent: 50, tone: "warning", showProgress: true },
          { keyLabel: "Traffic", valueLabel: "12.4 GB", percent: 0, tone: "neutral", showProgress: false },
        ]}
        action={
          <Button variant="primary" fullWidth>
            Add new device
          </Button>
        }
      />
      <CardRow>
        <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="MacBook Air" subtitle="Connected · Last seen 3m ago" />
        <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="warning" label="iPhone" subtitle="Config pending import" />
      </CardRow>
    </MockFrame>
  );
}

export function MockPageSettings() {
  const [autoRenew, setAutoRenew] = useState(true);

  return (
    <MockFrame title="Page Mock · Settings" subtitle="Section composition and account action priorities." current="settings" screenshotName="mock-page-settings">
      <PageSection title="Profile">
        <CardRow>
          <RowItem icon={<IconSettings size={15} strokeWidth={2} />} iconVariant="neutral" label="Edit profile" subtitle="Name, email, phone" />
          <RowItem icon={<IconInfo size={15} strokeWidth={2} />} iconVariant="neutral" label="Language" subtitle="English" />
        </CardRow>
      </PageSection>
      <PageSection title="Plan and billing" action={<Switch checked={autoRenew} onCheckedChange={setAutoRenew} aria-label="Auto renew" />}>
        <CardRow>
          <RowItem icon={<IconCreditCard size={15} strokeWidth={2} />} iconVariant="neutral" label="Change plan" subtitle="Upgrade or renew" />
          <RowItem icon={<IconClock size={15} strokeWidth={2} />} iconVariant="neutral" label="Billing history" subtitle="4 successful payments" />
        </CardRow>
      </PageSection>
      <InlineAlert variant="warning" label="Danger zone" message="Validate destructive action contrast and spacing in this area." />
      <Button variant="danger" fullWidth>
        Delete account and access
      </Button>
    </MockFrame>
  );
}

export function MockPageSupport() {
  return (
    <MockFrame title="Page Mock · Support" subtitle="Troubleshooting and support CTA hierarchy." current="support" screenshotName="mock-page-support">
      <InlineAlert
        variant="info"
        label="Connection diagnostics"
        message="Use guided flow first, then escalate to support if the issue persists."
      />
      <CardRow>
        <RowItem icon={<IconShield size={15} strokeWidth={2} />} iconVariant="neutral" label="Setup guide" subtitle="Install app, import config, verify traffic" />
        <RowItem icon={<IconAlertTriangle size={15} strokeWidth={2} />} iconVariant="warning" label="Troubleshooter" subtitle="No internet, invalid config, payment issues" />
        <RowItem icon={<IconInfo size={15} strokeWidth={2} />} iconVariant="neutral" label="FAQ" subtitle="Most common user questions" />
      </CardRow>
      <FooterHelp note="Still blocked?" linkLabel="Contact support" onLinkClick={() => {}} />
    </MockFrame>
  );
}

export function MockPageCheckout() {
  return (
    <MockFrame title="Page Mock · Checkout" subtitle="Payment confirmation states and summary density." current="checkout" screenshotName="mock-page-checkout">
      <CheckoutSummaryCard
        planDisplayName="Pro"
        showConfirmation={true}
        planDurationDays={90}
        planDeviceLimit={5}
      />
      <InlineAlert variant="success" label="Promo applied" message="SPRING30 saves 30 Stars on this order." />
      <Stack gap="2">
        <Button variant="primary" fullWidth>
          Continue to payment
        </Button>
        <Button variant="secondary" fullWidth>
          Back to plan selection
        </Button>
      </Stack>
    </MockFrame>
  );
}

export function MockPageOnboarding() {
  return (
    <MockFrame title="Page Mock · Onboarding" subtitle="First-run guidance and progressive CTA flow." current="onboarding" screenshotName="mock-page-onboarding">
      <PageSection title="Step 1 · Intro">
        <NewUserHero
          title="Welcome to the secure tunnel"
          description="We will guide you through plan choice, config issue, and connection verification."
          onChoosePlan={() => {}}
          onViewGuide={() => {}}
        />
      </PageSection>
      <PageSection title="Step 2 · Action">
        <Stack gap="2">
          <Button variant="primary" fullWidth>
            Continue
          </Button>
          <Button variant="ghost" fullWidth>
            Skip for now
          </Button>
        </Stack>
      </PageSection>
    </MockFrame>
  );
}

export function MockPageSetupGuide() {
  return (
    <MockFrame
      title="Page Mock · Setup guide"
      subtitle="Platform-specific install and connect guide."
      current="setupGuide"
      screenshotName="mock-page-setup-guide"
    >
      <InlineAlert
        variant="info"
        label="Quick setup"
        message="Download config, import into AmneziaVPN, then connect."
      />
      <PageSection title="iOS">
        <Stack gap="2">
          <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="1. Download config file" subtitle="Use share sheet" />
          <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="2. Open in AmneziaVPN" subtitle="Choose app from dialog" />
          <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="3. Confirm import" subtitle="Continue when prompted" />
          <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="4. Connect" subtitle="Allow VPN profile if requested" />
        </Stack>
      </PageSection>
      <Button variant="primary" fullWidth>
        Download configuration file
      </Button>
    </MockFrame>
  );
}

export function MockPageConnectStatus() {
  return (
    <MockFrame
      title="Page Mock · Connect status"
      subtitle="Connection verification and next actions."
      current="connectStatus"
      screenshotName="mock-page-connect-status"
    >
      <InlineAlert
        variant="success"
        label="VPN connected"
        message="Connection confirmed for the latest device."
      />
      <CardRow>
        <RowItem
          icon={<IconShield size={15} strokeWidth={2} />}
          iconVariant="neutral"
          label="Latest device"
          subtitle="MacBook Pro · Confirmed"
        />
        <RowItem
          icon={<IconInfo size={15} strokeWidth={2} />}
          iconVariant="neutral"
          label="Public IP"
          subtitle="185.199.110.42"
        />
      </CardRow>
      <Button variant="secondary" fullWidth>
        Re-check connection
      </Button>
    </MockFrame>
  );
}

export function MockPageRestoreAccess() {
  return (
    <MockFrame
      title="Page Mock · Restore access"
      subtitle="Expired plan recovery and billing handoff."
      current="restoreAccess"
      screenshotName="mock-page-restore-access"
    >
      <InlineAlert
        variant="warning"
        label="Access expired"
        message="Restore your subscription to reactivate VPN access."
      />
      <PageSection title="Recovery actions">
        <Stack gap="2">
          <Button variant="primary" fullWidth>
            Restore access
          </Button>
          <Button variant="secondary" fullWidth>
            Contact support
          </Button>
        </Stack>
      </PageSection>
    </MockFrame>
  );
}

export function MockPageReferral() {
  return (
    <MockFrame
      title="Page Mock · Referral"
      subtitle="Invite flow and referral stats composition."
      current="referral"
      screenshotName="mock-page-referral"
    >
      <InlineAlert
        variant="info"
        label="Invite progress"
        message="3 of 5 invites completed. Next reward: +7 days."
      />
      <CardRow>
        <RowItem icon={<IconUsers size={15} strokeWidth={2} />} iconVariant="neutral" label="Total referrals" subtitle="4" />
        <RowItem icon={<IconClock size={15} strokeWidth={2} />} iconVariant="neutral" label="Earned days" subtitle="21 days" />
      </CardRow>
      <Button variant="primary" fullWidth>
        Share invite link
      </Button>
    </MockFrame>
  );
}

export function MockComponentsButtons() {
  return (
    <MockFrame title="Component Mock · Buttons" subtitle="Variants, sizes, and transient states." current="buttons" screenshotName="mock-component-buttons">
      <PageSection title="Variants">
        <div className="mock-component-grid">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
      </PageSection>
      <PageSection title="Sizes and states">
        <div className="mock-component-grid">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button transientState="loading" loadingText="Saving">Loading</Button>
          <Button transientState="success" successText="Saved">Success</Button>
          <Button transientState="error" errorText="Failed">Error</Button>
        </div>
      </PageSection>
    </MockFrame>
  );
}

export function MockComponentsForms() {
  const [plan, setPlan] = useState("pro");
  const [agree, setAgree] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <MockFrame title="Component Mock · Forms" subtitle="Input controls, helper text, and validation visual checks." current="forms" screenshotName="mock-component-forms">
      <PageSection title="Fields">
        <Stack gap="2">
          <Input label="Display name" placeholder="Alex Doe" description="Shown in profile and receipts" />
          <Input label="Email" placeholder="alex@example.com" success="Looks good" />
          <Input label="Phone" placeholder="+1 202 555 0199" error="Invalid phone format" />
          <Select
            label="Plan tier"
            value={plan}
            onChange={setPlan}
            options={[
              { value: "starter", label: "Starter" },
              { value: "pro", label: "Pro" },
              { value: "max", label: "Max" },
            ]}
          />
          <Textarea label="Support message" placeholder="Describe your issue" rows={4} />
          <Checkbox label="I agree to Terms" checked={agree} onChange={(e) => setAgree(e.currentTarget.checked)} />
          <div className="mock-switch-row">
            <span>Auto-renew notifications</span>
            <Switch checked={notifications} onCheckedChange={setNotifications} aria-label="Notifications" />
          </div>
        </Stack>
      </PageSection>
    </MockFrame>
  );
}

export function MockComponentsFeedback() {
  return (
    <MockFrame title="Component Mock · Feedback" subtitle="Alerts and loading states across screen densities." current="feedback" screenshotName="mock-component-feedback">
      <Stack gap="2">
        <InlineAlert variant="info" label="Info" message="Use for neutral process hints." />
        <InlineAlert variant="success" label="Success" message="Use after non-critical action completion." />
        <InlineAlert variant="warning" label="Warning" message="Use when user attention is required." />
        <InlineAlert variant="error" label="Error" message="Use for blocking or failed operations." />
      </Stack>
      <PageSection title="Skeleton states">
        <Stack gap="2">
          <Skeleton variant="line" width="80%" />
          <Skeleton variant="card" height={120} />
          <SkeletonList lines={3} />
        </Stack>
      </PageSection>
    </MockFrame>
  );
}

export function MockComponentsCards() {
  return (
    <MockFrame title="Component Mock · Cards & Rows" subtitle="Card surfaces, data rows, and section spacing checks." current="cards" screenshotName="mock-component-cards">
      <PageSection title="CardRow patterns">
        <CardRow>
          <RowItem icon={<IconCreditCard size={15} strokeWidth={2} />} iconVariant="neutral" label="Payment method" subtitle="Telegram Stars" />
          <RowItem icon={<IconClock size={15} strokeWidth={2} />} iconVariant="warning" label="Renewal" subtitle="In 2 days" />
          <RowItem icon={<IconSmartphone size={15} strokeWidth={2} />} iconVariant="neutral" label="Devices" subtitle="3 active" />
        </CardRow>
      </PageSection>
      <PageSection title="Plan card states">
        <Stack gap="2">
          <PlanCard plan="Starter" planSub="Monthly" status="active" devices={1} deviceLimit={1} renewsLabel="May 20" />
          <PlanCard plan="Pro" planSub="Quarterly" status="expiring" devices={4} deviceLimit={5} renewsLabel="Tomorrow" />
          <PlanCard plan="Legacy" planSub="Expired" status="expired" devices={0} deviceLimit={1} renewsLabel="Expired" />
        </Stack>
      </PageSection>
    </MockFrame>
  );
}
