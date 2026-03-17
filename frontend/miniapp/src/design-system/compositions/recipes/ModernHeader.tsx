import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconSettings, IconChevronLeft } from "../../icons";

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
}: ModernHeaderProps) {
  const navigate = useNavigate();

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
          <button 
            className="modern-header-back-button"
            onClick={onBack}
            aria-label="Back"
          >
            <IconChevronLeft size={24} strokeWidth={2.4} />
          </button>
        ) : null}

        {displayName ? (
          <div
            className={
              pillChip ? "modern-profile-block modern-profile-row" : "modern-profile-block"
            }
          >
            <div
              className={
                pillChip ? "modern-avatar modern-avatar--profile" : "modern-avatar"
              }
            >
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{avatarInitial}</span>}
            </div>
            <div
              className={
                pillChip
                  ? "modern-profile-info modern-profile-info--row"
                  : "modern-profile-info"
              }
            >
              <span className="modern-header-title">{displayName}</span>
              {pillChip ?? (subtitle ? <div className="modern-header-label">{subtitle}</div> : null)}
            </div>
          </div>
        ) : (
          <div className="modern-header-formal">
            <h1 className="modern-header-page-title">{title}</h1>
            {subtitle ? <p className="modern-header-page-subtitle">{subtitle}</p> : null}
          </div>
        )}
      </div>
      
      {showSettings ? (
        <button 
          className="modern-icon-button"
          onClick={handleSettings}
          aria-label="Settings"
        >
          <IconSettings size={22} strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );
}
