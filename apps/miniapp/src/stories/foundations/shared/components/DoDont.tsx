import "./doDont.css";
import type { ReactNode } from "react";

type DoDontVariant = "do" | "dont";

interface DoDontPanelProps {
  content: ReactNode;
  label: string;
  variant: DoDontVariant;
  caption?: string;
}

export interface DoDontProps {
  do: ReactNode;
  dont: ReactNode;
  doLabel?: string;
  dontLabel?: string;
  doCaption?: string;
  dontCaption?: string;
  stacked?: boolean;
}

interface DoDontVariantConfig {
  className: string;
  labelClassName: string;
  symbol: string;
}

const DO_DONT_VARIANT_CONFIG: Record<DoDontVariant, DoDontVariantConfig> = {
  do: {
    className: "do-dont__panel--do",
    labelClassName: "do-dont__label--do",
    symbol: "✓",
  },
  dont: {
    className: "do-dont__panel--dont",
    labelClassName: "do-dont__label--dont",
    symbol: "✕",
  },
};

function DoDontPanel({ content, label, variant, caption }: DoDontPanelProps) {
  const variantConfig = DO_DONT_VARIANT_CONFIG[variant];

  return (
    <div className={`do-dont__panel ${variantConfig.className}`}>
      <div className="do-dont__header">
        <span className={`do-dont__symbol ${variantConfig.labelClassName}`} aria-hidden="true">
          {variantConfig.symbol}
        </span>
        <span className={`do-dont__label ${variantConfig.labelClassName}`}>{label}</span>
      </div>

      <div className="do-dont__body">{content}</div>

      {caption ? <p className="do-dont__caption">{caption}</p> : null}
    </div>
  );
}

DoDontPanel.displayName = "DoDontPanel";

export function DoDont({
  do: doContent,
  dont: dontContent,
  doLabel = "Do",
  dontLabel = "Don't",
  doCaption,
  dontCaption,
  stacked = false,
}: DoDontProps) {
  return (
    <div className={stacked ? "do-dont do-dont--stacked" : "do-dont"}>
      <DoDontPanel content={doContent} label={doLabel} variant="do" caption={doCaption} />
      <DoDontPanel content={dontContent} label={dontLabel} variant="dont" caption={dontCaption} />
    </div>
  );
}

DoDont.displayName = "DoDont";
