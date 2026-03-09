import type { HTMLAttributes, ReactNode } from "react";

export interface TierFeatureRowProps {
  check?: boolean;
  icon?: "yes" | "no" | "amber";
  text: ReactNode;
  value?: ReactNode;
}

export function TierFeatureRow({ check, icon, text, value }: TierFeatureRowProps) {
  const tone = icon ?? (check ? "yes" : "no");
  return (
    <div className="feat-row">
      <div className={`feat-ico ${tone}`}>
        {tone === "yes" ? (
          <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
            <path d="M2 7l3 3 7-7" />
          </svg>
        ) : tone === "amber" ? (
          <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
            <path d="M7 3v4.5M7 10.5v.4" />
            <circle cx="7" cy="7" r="5.2" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        )}
      </div>
      <div className="feat-text">{text}</div>
      {value != null ? <div className="feat-val">{value}</div> : null}
    </div>
  );
}

export interface TierCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  badge?: ReactNode;
  name: string;
  description?: string;
  priceMain: ReactNode;
  priceSub?: ReactNode;
  priceOriginal?: ReactNode;
  period?: string;
  features: Array<TierFeatureRowProps>;
  selectLabel: string;
  selected?: boolean;
  featured?: boolean;
  onSelect?: () => void;
  selectDisabled?: boolean;
  selectAriaLabel?: string;
}

/** Content Library 16: Tier card for plan comparison. */
export function TierCard({
  badge,
  name,
  description,
  priceMain,
  priceSub,
  priceOriginal,
  period,
  features,
  selectLabel,
  selected,
  featured,
  onSelect,
  selectDisabled,
  selectAriaLabel,
  className = "",
  ...props
}: TierCardProps) {
  const stateClass = [selected && "selected", featured && "featured"].filter(Boolean).join(" ");
  return (
    <div
      className={`tier-card ${stateClass} ${className}`.trim()}
      data-tier={name.toLowerCase()}
      {...props}
    >
      {badge != null ? <div className="tier-badge">{badge}</div> : null}
      <div className="tier-body">
        <div className="tier-top">
          <div className="tier-info">
            <div className="tier-name">{name}</div>
            {description != null ? <div className="tier-desc">{description}</div> : null}
          </div>
          <div className="tier-pricing">
            <div className="tier-price">{priceMain}{priceSub != null ? <sub>{priceSub}</sub> : null}</div>
            {priceOriginal != null ? <div className="tier-orig">{priceOriginal}</div> : null}
            {period != null ? <div className="tier-period">{period}</div> : null}
          </div>
        </div>
        <div className="tier-features">
          {features.map((f, i) => (
            <TierFeatureRow
              key={i}
              check={f.check}
              icon={f.icon}
              text={f.text}
              value={f.value}
            />
          ))}
        </div>
        <button
          type="button"
          className="tier-select-btn"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.();
          }}
          disabled={selectDisabled}
          aria-label={selectAriaLabel}
        >
          {selectLabel}
        </button>
      </div>
    </div>
  );
}
