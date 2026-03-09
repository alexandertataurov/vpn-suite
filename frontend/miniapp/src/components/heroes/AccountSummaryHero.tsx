import { useCallback, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export interface AccountSummaryHeroProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  initial: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  memberSince?: string;
  /** Optional display-safe account ID; when set, shown as secondary copyable line. */
  accountId?: string | null;
  badge?: ReactNode;
}

/** Content Library 3c: Account Summary Hero. */
export function AccountSummaryHero({
  initial,
  name,
  email,
  photoUrl,
  memberSince,
  accountId,
  badge,
  className = "",
  ...props
}: AccountSummaryHeroProps) {
  const [copied, setCopied] = useState(false);
  const copyId = useCallback(() => {
    if (!accountId) return;
    void navigator.clipboard.writeText(accountId).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [accountId]);

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
          {accountId ? (
            <div className="acct-id-row">
              <span className="acct-id-label">Account ID</span>
              <code className="acct-id-val">{accountId}</code>
              <button
                type="button"
                className="acct-id-copy"
                onClick={copyId}
                aria-label="Copy account ID"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
        </div>
        {badge ? <div className="acct-status">{badge}</div> : null}
      </div>
    </div>
  );
}
