import { Link, useLocation } from "react-router-dom";

export interface BreadcrumbItem {
  to: string;
  label: string;
}

export interface AvionicsBreadcrumbsProps {
  /** Mission name, e.g. VPN-NET-GLOBAL-01 */
  missionName?: string;
  /** Path segments in monospace: SYS > INFRA > NODE-042 */
  items?: BreadcrumbItem[];
  /** Current page label (last segment). Default derived from path. */
  current?: string;
}

const segmentToLabel = (seg: string, fullPath: string): string => {
  if (seg === "servers") return "INFRA";
  if (seg === "users" || seg === "devices") return "ACCESS";
  if (seg === "" || seg === "/") return "SYS";
  if (/^[a-f0-9-]{8,}$/i.test(seg)) return `NODE-${seg.slice(0, 8)}`;
  if (/^\d+$/.test(seg)) return `NODE-${seg.padStart(3, "0")}`;
  if (fullPath.startsWith("/users/") && seg !== "users") return `USER-${seg}`;
  return seg.toUpperCase();
};

export function AvionicsBreadcrumbs({
  missionName = "VPN-NET-GLOBAL-01",
  items,
  current,
}: AvionicsBreadcrumbsProps) {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = items ?? (() => {
    const out: BreadcrumbItem[] = [];
    let acc = "";
    for (let idx = 0; idx < segments.length - 1; idx++) {
      const seg = segments[idx] ?? "";
      acc += `/${seg}`;
      out.push({ to: acc, label: segmentToLabel(seg, location.pathname) });
    }
    return out;
  })();
  const lastSeg = segments[segments.length - 1] ?? "";
  const displayCurrent = current ?? segmentToLabel(lastSeg, location.pathname);

  return (
    <nav className="avionics-breadcrumbs" aria-label="Breadcrumb">
      {missionName && (
        <span className="avionics-breadcrumbs-mission" aria-hidden>
          {missionName}
        </span>
      )}
      {crumbs.length > 0 && missionName && (
        <span className="avionics-breadcrumbs-sep"> &gt; </span>
      )}
      {crumbs.map((item) => (
        <span key={item.to} className="avionics-breadcrumbs-chain">
          <Link to={item.to} className="avionics-breadcrumbs-link">
            {item.label}
          </Link>
          <span className="avionics-breadcrumbs-sep"> &gt; </span>
        </span>
      ))}
      <span className="avionics-breadcrumbs-current" aria-current="page">
        {displayCurrent}
      </span>
    </nav>
  );
}
