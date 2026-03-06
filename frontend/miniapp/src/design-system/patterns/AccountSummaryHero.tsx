import type { HTMLAttributes, ReactNode } from "react";

export interface AccountSummaryHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  initial: string;
  name: string;
  email: string;
  memberSince?: string;
  badge?: ReactNode;
}

/** Content Library 3c: Account Summary Hero. */
export function AccountSummaryHero({
  initial,
  name,
  email,
  memberSince,
  badge,
  className = "",
  ...props
}: AccountSummaryHeroProps) {
  return (
    <div className={`acct-hero stagger-1 ${className}`.trim()} {...props}>
      <div className="acct-hero-body">
        <div className="acct-avatar" aria-hidden>
          {initial}
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
