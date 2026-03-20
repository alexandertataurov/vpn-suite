import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/Button";
import { IconChevronLeft } from "../../../icons";
import { ProfileRow } from "./ProfileRow";
import { SettingsButton } from "../../patterns";

export interface ModernHeaderProps {
  /** Profile name shown on the left, e.g. on the Home page. */
  displayName?: string;
  avatarUrl?: string;
  avatarInitial?: string;
  /** Eyebrow label under the display name (e.g. plan name or "Settings"). */
  subtitle?: string;
  /** Plan/status pill chip (Beta, PRO, Expiring, Expired) per amnezia spec. */
  pillChip?: ReactNode;
  /** Shows the settings gear icon. Default true on Home; pass false on inner pages. */
  showSettings?: boolean;
  onSettingsClick?: () => void;
  /** When no displayName — shows a formal page title (inner pages). */
  title?: string;
  /** Optional back button callback. If provided, shows a back chevron. */
  onBack?: () => void;
  backLabel?: string;
  settingsLabel?: string;
}

function deriveInitials(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function ModernHeader({
  displayName,
  avatarUrl,
  avatarInitial,
  subtitle,
  pillChip,
  showSettings = true,
  onSettingsClick,
  title,
  onBack,
  backLabel = "Back",
  settingsLabel = "Settings",
}: ModernHeaderProps) {
  const navigate = useNavigate();
  const derivedInitials = avatarInitial ?? deriveInitials(displayName);

  const handleSettings = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate("/settings");
    }
  };

  return (
    <div className="modern-header" data-layer="ModernHeader">
      <div className="modern-header-left">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="modern-header-back-button"
            onClick={onBack}
            aria-label={backLabel}
          >
            <IconChevronLeft size={24} strokeWidth={2.4} />
          </Button>
        ) : null}

        {displayName && pillChip ? (
          <ProfileRow
            name={displayName}
            initials={avatarInitial ?? derivedInitials}
            status="active"
            chip={pillChip}
            onSettings={handleSettings}
          />
        ) : displayName ? (
          <div className="modern-profile-block">
            <div className="modern-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{derivedInitials}</span>}
            </div>
            <div className="modern-profile-info">
              <span className="modern-header-title">{displayName}</span>
              {subtitle ? <div className="modern-header-label">{subtitle}</div> : null}
            </div>
          </div>
        ) : (
          <div className="modern-header-formal">
            <h1 className="modern-header-page-title">{title}</h1>
            {subtitle ? <p className="modern-header-page-subtitle">{subtitle}</p> : null}
          </div>
        )}
      </div>
      
      {showSettings && !(displayName && pillChip) ? (
        <SettingsButton
          onClick={handleSettings}
          className="settings-pill"
          aria-label={settingsLabel}
        />
      ) : null}
    </div>
  );
}
