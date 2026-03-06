/* eslint-disable react/forbid-dom-props */
import { useCallback, useState, type CSSProperties } from "react";

interface TokenSwatchProps {
  cssVar: string;
  usage?: string;
  heightToken?: string;
  showBorder?: boolean;
}

export function TokenSwatch({ cssVar, usage, heightToken = "--spacing-12", showBorder = true }: TokenSwatchProps) {
  const [copied, setCopied] = useState(false);
  const value = `var(${cssVar})`;
  const resolvedHeight = heightToken.startsWith("--") ? `var(${heightToken})` : heightToken;

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  }, [value]);

  const swatchColor = cssVar.startsWith("--") ? `var(${cssVar})` : cssVar;
  const swatchStyle: CSSProperties = {
    "--sb-swatch-color": swatchColor,
    "--sb-swatch-height": resolvedHeight,
  };
  return (
    <div className="sb-swatch">
      <div
        className={`sb-swatch-block${showBorder ? "" : " sb-swatch-borderless"}`}
        style={swatchStyle}
        onClick={copy}
        onKeyDown={(e) => e.key === "Enter" && copy()}
        role="button"
        tabIndex={0}
        aria-label={`Copy ${value}`}
      />
      <code className="sb-swatch-code">{cssVar}</code>
      {usage && <span className="sb-swatch-usage">{usage}</span>}
      <button type="button" onClick={copy} className="sb-swatch-action">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
