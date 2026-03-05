import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconChevronLeft, IconX } from "@/lib/icons";
import { telegramClient } from "@/telegram/telegramClient";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";

/**
 * Production layer: fixed header (title, nav). Height 56–64px. Never scrolls.
 */
export interface HeaderZoneProps {
  routeLabel: string;
  isOnline: boolean;
  stackFlow?: boolean;
}

type HeaderAction = "back" | "close" | null;

function resolveHeaderAction(pathname: string, stackFlow: boolean): HeaderAction {
  if (!stackFlow) return null;
  if (pathname === "/onboarding" || pathname.startsWith("/plan/checkout/")) {
    return "close";
  }
  return "back";
}

export function HeaderZone({ routeLabel, isOnline, stackFlow = false }: HeaderZoneProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { impact } = useTelegramHaptics();
  const action = resolveHeaderAction(location.pathname, stackFlow);

  const handleLeftAction = useCallback(() => {
    if (!action) return;
    impact("light");

    if (action === "close") {
      if (telegramClient.isAvailable()) {
        telegramClient.close();
        return;
      }
      if (location.pathname.startsWith("/plan/checkout/")) {
        navigate("/plan", { replace: true });
        return;
      }
      navigate("/", { replace: true });
      return;
    }

    if (location.pathname === "/servers") {
      navigate("/");
      return;
    }
    if (location.pathname === "/referral") {
      navigate("/settings");
      return;
    }
    navigate(-1);
  }, [action, impact, location.pathname, navigate]);

  return (
    <header
      className={`miniapp-header ${stackFlow ? "miniapp-header--stack" : ""}`.trim()}
      data-layer="HeaderZone"
    >
      <div className="miniapp-header-inner">
        <div className="miniapp-header-slot miniapp-header-slot--left">
          {action ? (
            <button
              type="button"
              className="miniapp-header-nav-button"
              onClick={handleLeftAction}
              aria-label={action === "close" ? "Close screen" : "Go back"}
            >
              {action === "close"
                ? <IconX size={24} strokeWidth={1.8} />
                : <IconChevronLeft size={24} strokeWidth={1.8} />}
            </button>
          ) : (
            <span className="miniapp-header-slot-placeholder" aria-hidden />
          )}
        </div>

        <h1 className="miniapp-header-title" title={routeLabel}>{routeLabel}</h1>

        <div className="miniapp-header-slot miniapp-header-slot--right" aria-hidden>
          <span className={`miniapp-header-connection-dot ${isOnline ? "is-online" : "is-offline"}`} />
        </div>
      </div>
    </header>
  );
}
