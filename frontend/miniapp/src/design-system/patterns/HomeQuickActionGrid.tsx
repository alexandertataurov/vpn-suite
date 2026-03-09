import {
  IconSmartphone,
  IconCreditCard,
  IconDownload,
  IconGlobe,
  IconHelpCircle,
  IconUsers,
  type IconType,
} from "../icons";
import { useLocation } from "react-router-dom";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { MissionOperationLink, type MissionTone } from "./MissionPrimitives";

interface QuickAction {
  label: string;
  description: string;
  to: string;
  icon: IconType;
}

type StyledQuickAction = QuickAction & { tone: MissionTone; iconTone: MissionTone };

export interface HomeQuickActionGridProps {
  hasSub: boolean;
}

export function HomeQuickActionGrid({ hasSub }: HomeQuickActionGridProps) {
  const { impact } = useTelegramHaptics();
  const location = useLocation();

  const actions: StyledQuickAction[] = [
    ...(hasSub
      ? [
          {
            label: "Manage Devices",
            description: "Devices & configurations",
            to: "/devices",
            icon: IconSmartphone,
            tone: "blue",
            iconTone: "blue",
          },
          {
            label: "Download Config",
            description: "Get config for VPN app",
            to: "/devices",
            icon: IconDownload,
            tone: "blue",
            iconTone: "blue",
          },
          {
            label: "Change server",
            description: "Route and region",
            to: "/servers",
            icon: IconGlobe,
            tone: "amber",
            iconTone: "amber",
          },
        ] satisfies StyledQuickAction[]
      : [
          {
            label: "Get Plan",
            description: "Activate secure access",
            to: "/plan",
            icon: IconCreditCard,
            tone: "blue",
            iconTone: "blue",
          },
        ] satisfies StyledQuickAction[]),
    {
      label: "Subscription",
      description: "Plan and billing",
      to: "/plan",
      icon: IconCreditCard,
      tone: "amber",
      iconTone: "amber",
    },
    {
      label: "Support",
      description: "Troubleshoot issues",
      to: "/support",
      icon: IconHelpCircle,
      tone: "red",
      iconTone: "red",
    },
    {
      label: "Invite Friends",
      description: "Earn free VPN time",
      to: "/referral",
      icon: IconUsers,
      tone: "green",
      iconTone: "green",
    },
  ];

  return (
    <div className="list-card home-qa-card">
      <div className="ops quick-action-grid">
        {actions.map(({ label, description, to, icon: Icon, tone, iconTone }) => (
          <MissionOperationLink
            key={`${to}-${label}`}
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
        ))}
      </div>
    </div>
  );
}
