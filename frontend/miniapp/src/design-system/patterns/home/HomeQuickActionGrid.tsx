import {
  IconGlobe,
  IconUsers,
  type IconType,
} from "../../icons";
import { useLocation } from "react-router-dom";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { MissionOperationLink, type MissionTone } from "../mission/Mission";

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
            label: "Server location",
            description: "Routing and location",
            to: "/servers",
            icon: IconGlobe,
            tone: "amber",
            iconTone: "amber",
          },
        ] satisfies StyledQuickAction[]
      : [
        ] satisfies StyledQuickAction[]),
    {
      label: "Referral",
      description: "Copy your invite link",
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
