import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconChevronLeft } from "../icons";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";

export interface ShellContextBlockProps {
  stackFlow?: boolean;
}

type HeaderAction = "back" | null;

function resolveHeaderAction(pathname: string, stackFlow: boolean): HeaderAction {
  if (!stackFlow) return null;
  if (pathname === "/onboarding") return null;
  return "back";
}

function getFallbackRoute(pathname: string): string {
  if (pathname.startsWith("/plan/checkout/")) return "/plan";
  if (pathname === "/devices/issue") return "/devices";
  return "/";
}

export function ShellContextBlock({ stackFlow = false }: ShellContextBlockProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { impact } = useTelegramHaptics();
  const action = resolveHeaderAction(location.pathname, stackFlow);
  const backState = (location.state as { from?: string } | null) ?? null;

  const handleAction = useCallback(() => {
    if (!action) return;
    impact("light");

    if (typeof backState?.from === "string" && backState.from && backState.from !== location.pathname) {
      navigate(backState.from);
      return;
    }
    if (typeof window !== "undefined" && window.history.length <= 1) {
      navigate(getFallbackRoute(location.pathname), { replace: true });
      return;
    }
    navigate(-1);
  }, [action, backState?.from, impact, location.pathname, navigate]);

  const actionLabel = "Back";

  return (
    <section className="miniapp-shell-context" aria-label="Navigation and status">
      <div className="miniapp-shell-context-row">
        {action ? (
          <button
            type="button"
            className="miniapp-shell-context-action"
            onClick={handleAction}
            aria-label="Go back"
          >
            <IconChevronLeft size={18} strokeWidth={1.9} />
            <span>{actionLabel}</span>
          </button>
        ) : (
          <span className="miniapp-shell-context-spacer" aria-hidden />
        )}
      </div>
    </section>
  );
}
