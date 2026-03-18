import type { ReactNode } from "react";

export interface FooterHelpProps {
  note: ReactNode;
  linkLabel: ReactNode;
  onLinkClick: () => void;
}

/**
 * Footer help block — "Having trouble? View setup guide".
 * Uses design tokens.
 */
export function FooterHelp({ note, linkLabel, onLinkClick }: FooterHelpProps) {
  return (
    <div className="footer-help">
      <p className="footer-help__note">
        {note}{" "}
        <span
          role="button"
          tabIndex={0}
          className="footer-help__link"
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
