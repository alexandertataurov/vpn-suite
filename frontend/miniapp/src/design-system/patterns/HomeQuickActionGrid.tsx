import {
  IconSmartphone,
  IconGlobe,
  IconCreditCard,
  IconUser,
  IconHelpCircle,
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
            label: "Connection Details",
            description: "Manage your devices",
            to: "/devices",
            icon: IconSmartphone,
            tone: "blue",
            iconTone: "blue",
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
      label: "Change Server",
      description: "Pick endpoint region",
      to: "/servers",
      icon: IconGlobe,
      tone: "green",
      iconTone: "green",
    },
    {
      label: "Account",
      description: "Open plan and settings",
      to: "/settings",
      icon: IconUser,
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
  ];

  return (
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
          icon={<Icon size={20} strokeWidth={1.6} />}
          title={label}
          description={description}
        />
      ))}
    </div>
  );
}
