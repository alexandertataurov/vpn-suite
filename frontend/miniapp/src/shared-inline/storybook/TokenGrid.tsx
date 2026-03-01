import { TokenSwatch } from "./TokenSwatch";

interface TokenItem {
  name: string;
  cssVar: string;
  usage?: string;
}

interface TokenGridProps {
  items: TokenItem[];
  columns?: number | "auto";
  heightToken?: string;
}

export function TokenGrid({ items, columns = "auto", heightToken }: TokenGridProps) {
  const columnsAttr = typeof columns === "number" ? String(columns) : undefined;
  return (
    <div className="sb-grid" data-columns={columnsAttr}>
      {items.map(({ name, cssVar, usage }) => (
        <TokenSwatch key={name} cssVar={cssVar} usage={usage} heightToken={heightToken} />
      ))}
    </div>
  );
}
