import { Link } from "react-router-dom";
import {
  IconPlus,
  IconGlobe,
  IconCreditCard,
  IconUsers,
  IconHelpCircle,
  type IconType,
} from "@/lib/icons";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

interface QuickAction {
  label: string;
  description: string;
  to: string;
  icon: IconType;
}

type QuickActionEdge = "e-b" | "e-g" | "e-a" | "e-r";
type QuickActionTone = "b" | "g" | "a" | "r";
type StyledQuickAction = QuickAction & { edge: QuickActionEdge; iconTone: QuickActionTone };

export interface HomeQuickActionGridProps {
  hasSub: boolean;
  hasDevices: boolean;
}

export function HomeQuickActionGrid({ hasSub, hasDevices }: HomeQuickActionGridProps) {
  const { impact } = useTelegramHaptics();

  const actions: StyledQuickAction[] = [
    ...(hasSub
      ? [
          {
            label: hasDevices ? "Issue config" : "Add device",
            description: hasDevices ? "Rebuild or rotate client profile" : "Generate your first secure profile",
            to: "/devices",
            icon: IconPlus,
            edge: "e-b",
            iconTone: "b",
          },
        ] satisfies StyledQuickAction[]
      : [
          {
            label: "Get plan",
            description: "Activate subscription access",
            to: "/plan",
            icon: IconCreditCard,
            edge: "e-b",
            iconTone: "b",
          },
        ] satisfies StyledQuickAction[]),
    {
      label: "Servers",
      description: "Switch routing location",
      to: "/servers",
      icon: IconGlobe,
      edge: "e-g",
      iconTone: "g",
    },
    {
      label: "Invite",
      description: "Share link and earn days",
      to: "/referral",
      icon: IconUsers,
      edge: "e-a",
      iconTone: "a",
    },
    {
      label: "Support",
      description: "Troubleshoot connection issues",
      to: "/support",
      icon: IconHelpCircle,
      edge: "e-r",
      iconTone: "r",
    },
  ];

  return (
    <div className="ops">
      {actions.map(({ label, description, to, icon: Icon, edge, iconTone }) => (
        <Link
          key={`${to}-${label}`}
          to={to}
          className={`op quick-action-card ${edge}`}
          onClick={() => impact("light")}
          aria-label={label}
        >
          <span className={`op-ico quick-action-icon ${iconTone}`} aria-hidden>
            <Icon size={18} strokeWidth={1.6} />
          </span>
          <span className="op-body quick-action-content">
            <span className="op-name quick-action-label">{label}</span>
            <span className="op-desc quick-action-meta">{description}</span>
          </span>
          <span className="op-chev quick-action-chevron" aria-hidden>
            ›
          </span>
        </Link>
      ))}
    </div>
  );
}
