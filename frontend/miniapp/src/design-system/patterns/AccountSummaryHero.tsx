import type { HTMLAttributes, ReactNode } from "react";

export interface AccountSummaryHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  initial: string;
  name: string;
  email: string;
  /** Profile image URL (e.g. from DB / Telegram). When set, avatar shows image instead of initial. */
  photoUrl?: string | null;
  memberSince?: string;
  badge?: ReactNode;
}

/** Content Library 3c: Account Summary Hero. */
export function AccountSummaryHero({
  initial,
  name,
  email,
  photoUrl,
  memberSince,
  badge,
  className = "",
  ...props
}: AccountSummaryHeroProps) {
  return (
    <div className={["acct-hero", "stagger-1", className].filter(Boolean).join(" ")} {...props}>
      <div className="acct-hero-body">
        <div className="acct-avatar" aria-hidden>
          {photoUrl ? (
            <img src={photoUrl} alt="" className="acct-avatar-img" />
          ) : (
            initial
          )}
        </div>
        <div className="acct-info">
          <div className="acct-name">{name}</div>
          <div className="acct-email">{email}</div>
          {memberSince ? <div className="acct-since">{memberSince}</div> : null}
        </div>
        {badge ? <div className="acct-status">{badge}</div> : null}
      </div>
    </div>
  );
}
