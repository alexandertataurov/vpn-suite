import { Link } from "react-router-dom";
import {
  IconPlus,
  IconGlobe,
  IconCreditCard,
  IconUsers,
  IconHelpCircle,
  type IconType,
} from "@/shared-inline/icons";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

interface QuickAction {
  label: string;
  to: string;
  icon: IconType;
}

export interface HomeQuickActionGridProps {
  hasSub: boolean;
  hasDevices: boolean;
}

export function HomeQuickActionGrid({ hasSub, hasDevices }: HomeQuickActionGridProps) {
  const { impact } = useTelegramHaptics();

  const actions: QuickAction[] = [
    ...(hasSub
      ? [
          {
            label: hasDevices ? "Get config" : "Add device",
            to: "/devices",
            icon: IconPlus,
          },
        ]
      : [{ label: "Plan", to: "/plan", icon: IconCreditCard }]),
    { label: "Servers", to: "/servers", icon: IconGlobe },
    { label: "Invite", to: "/referral", icon: IconUsers },
    { label: "Support", to: "/support", icon: IconHelpCircle },
  ];

  return (
    <div className="home-quick-action-grid">
      {actions.map(({ label, to, icon: Icon }) => ( // key=
        <Link key={to + label}
          to={to}
          className="home-quick-action-card stagger-item"
          onClick={() => impact("light")}
        >
          <span className="home-quick-action-icon" aria-hidden>
            <Icon size={20} />
          </span>
          <span className="home-quick-action-label">{label}</span>
        </Link>
      ))}
    </div>
  );
}
