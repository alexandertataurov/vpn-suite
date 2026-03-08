/**
 * Production layer: fixed header title only.
 */
export interface HeaderZoneProps {
  stackFlow?: boolean;
}

export function HeaderZone({ stackFlow = false }: HeaderZoneProps) {
  const shellTitle = "\u03b1";
  const shellTitleAria = "Alpha";

  return (
    <header
      className={`miniapp-header ${stackFlow ? "miniapp-header--stack" : ""}`.trim()}
      data-layer="HeaderZone"
    >
      <div className="miniapp-header-inner">
        <div className="miniapp-header-bar miniapp-header-bar--title-only">
          <div className="miniapp-header-title-wrap">
            <h1
              className="miniapp-header-title"
              title={shellTitleAria}
              aria-label={shellTitleAria}
            >
              {shellTitle}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
