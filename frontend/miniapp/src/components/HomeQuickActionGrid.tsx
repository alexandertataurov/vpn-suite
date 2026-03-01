import { Link } from "react-router-dom";
import { Plus, Globe, CreditCard, Users, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
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
            icon: Plus,
          },
        ]
      : [{ label: "Plan", to: "/plan", icon: CreditCard }]),
    { label: "Servers", to: "/servers", icon: Globe },
    { label: "Invite", to: "/referral", icon: Users },
    { label: "Support", to: "/support", icon: HelpCircle },
  ];

  return (
    <div className="home-quick-action-grid">
      {actions.map(({ label, to, icon: Icon }) => (
        <Link
          key={to + label}
          to={to}
          className="home-quick-action-card"
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
