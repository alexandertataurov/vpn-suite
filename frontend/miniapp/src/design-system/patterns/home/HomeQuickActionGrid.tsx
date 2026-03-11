import {
  IconDownload,
  IconGlobe,
  IconSmartphone,
  IconUsers,
  type IconType,
} from "../../icons";
import { useLocation } from "react-router-dom";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { MissionOperationArticle, MissionOperationLink, type MissionTone } from "../mission/Mission";

export type HomeQuickActionKey = "add_device" | "change_server" | "download_config" | "refer_friend" | "view_usage";

interface QuickAction {
  key: HomeQuickActionKey;
  label: string;
  description: string;
  to: string;
  icon: IconType;
  priority: number;
  disabled?: boolean;
  disabledReason?: string;
}

type StyledQuickAction = QuickAction & { tone: MissionTone; iconTone: MissionTone };

export interface HomeQuickActionGridProps {
  hasSub?: boolean;
  status?: "connected" | "disconnected" | "connecting" | "error";
  deviceCount?: number;
  planLimit?: number | null;
  planKind?: "trial" | "paid";
  maxVisible?: number;
  devicesTo?: string;
  serverTo?: string;
  configTo?: string;
  referralTo?: string;
  usageTo?: string;
  disabledActions?: Partial<Record<HomeQuickActionKey, string>>;
}

function UsageIcon(props: { size?: number; strokeWidth?: number }) {
  const { size = 16, strokeWidth = 1.6 } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden>
      <path d="M5 18V10" />
      <path d="M12 18V6" />
      <path d="M19 18v-4" />
    </svg>
  );
}

export function HomeQuickActionGrid({
  hasSub = false,
  status = hasSub ? "connected" : "disconnected",
  deviceCount = 0,
  planLimit = null,
  planKind = hasSub ? "paid" : "trial",
  maxVisible = 4,
  devicesTo = "/devices",
  serverTo = "/servers",
  configTo = "/setup",
  referralTo = "/referral",
  usageTo = "/plan",
  disabledActions,
}: HomeQuickActionGridProps) {
  const { impact } = useTelegramHaptics();
  const location = useLocation();

  const actions = ([
    {
      key: "add_device",
      label: "Add device",
      description: planLimit != null && deviceCount < planLimit
        ? `${planLimit - deviceCount} slot${planLimit - deviceCount === 1 ? "" : "s"} available`
        : "Issue a new device profile",
      to: devicesTo,
      icon: IconSmartphone,
      priority: 1,
      tone: "blue",
      iconTone: "blue",
      disabled: !hasSub || (planLimit != null && deviceCount >= planLimit) || disabledActions?.add_device != null,
      disabledReason: disabledActions?.add_device
        ?? (!hasSub ? "Requires active plan" : planLimit != null && deviceCount >= planLimit ? "Plan limit reached" : undefined),
    },
    {
      key: "change_server",
      label: "Change server",
      description: "Pick a faster or closer route",
      to: serverTo,
      icon: IconGlobe,
      priority: 2,
      tone: "amber",
      iconTone: "amber",
      disabled: status !== "connected" || disabledActions?.change_server != null,
      disabledReason: disabledActions?.change_server ?? (status !== "connected" ? "Connect first" : undefined),
    },
    {
      key: "download_config",
      label: "Download config",
      description: "Export or reinstall the current profile",
      to: configTo,
      icon: IconDownload,
      priority: 3,
      tone: "blue",
      iconTone: "blue",
      disabled: disabledActions?.download_config != null,
      disabledReason: disabledActions?.download_config,
    },
    {
      key: "refer_friend",
      label: "Refer a friend",
      description: "Share your invite link",
      to: referralTo,
      icon: IconUsers,
      priority: 4,
      tone: "green",
      iconTone: "green",
      disabled: planKind === "trial" || disabledActions?.refer_friend != null,
      disabledReason: disabledActions?.refer_friend ?? (planKind === "trial" ? "Unavailable - upgrade from trial to share referrals" : undefined),
    },
    {
      key: "view_usage",
      label: "View usage",
      description: "Check data, time left, and plan health",
      to: usageTo,
      icon: UsageIcon as IconType,
      priority: 5,
      tone: "blue",
      iconTone: "blue",
      disabled: disabledActions?.view_usage != null,
      disabledReason: disabledActions?.view_usage,
    },
  ] satisfies StyledQuickAction[])
    .sort((left, right) => left.priority - right.priority)
    .slice(0, maxVisible);

  return (
    <div className="list-card home-qa-card">
      <div className="ops quick-action-grid">
        {actions.map(({ key, label, description, to, icon: Icon, tone, iconTone, disabled, disabledReason }) => (
          disabled ? (
            <MissionOperationArticle
              key={`${key}-${label}`}
              as="div"
              tone={tone}
              iconTone={iconTone}
              className="quick-action-card quick-action-card--disabled"
              aria-disabled
              icon={<Icon size={16} strokeWidth={1.6} />}
              title={label}
              description={disabledReason ?? description}
            />
          ) : (
            <MissionOperationLink
              key={`${key}-${label}`}
              to={to}
              state={{ from: location.pathname }}
              tone={tone}
              iconTone={iconTone}
              className="quick-action-card"
              onClick={() => impact("light")}
              aria-label={label}
              icon={<Icon size={16} strokeWidth={1.6} />}
              title={label}
              description={description}
            />
          )
        ))}
      </div>
    </div>
  );
}
