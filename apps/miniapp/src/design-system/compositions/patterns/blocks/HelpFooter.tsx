import type { ReactNode } from "react";

export interface HelpFooterProps {
  note: ReactNode;
  linkLabel: ReactNode;
  onLinkClick: () => void;
  className?: string;
}

/**
 * Footer help block: note + clickable link.
 * Extracted from FooterHelp. Uses footer-help classes from modern.css.
 */
export function HelpFooter({ note, linkLabel, onLinkClick, className }: HelpFooterProps) {
  return (
    <div className={["help-footer", className].filter(Boolean).join(" ")}>
      <p className="help-footer__note">
        {note}{" "}
        <span
          role="button"
          tabIndex={0}
          className="help-footer__link"
          onClick={onLinkClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onLinkClick();
            }
          }}
        >
          {linkLabel}
        </span>
      </p>
    </div>
  );
}
