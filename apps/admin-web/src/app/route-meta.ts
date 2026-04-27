export type NavSection = "Monitor" | "Customers" | "Config";

export interface RouteMeta {
  path: string;
  title: string;
  requiresAuth: boolean;
  navVisible?: boolean;
  navLabel?: string;
  navSection?: NavSection;
  navShort?: string;
}

export const ROUTES_META: RouteMeta[] = [
  { path: "/login", title: "Login", requiresAuth: false, navVisible: false },
  { path: "/", title: "Overview", requiresAuth: true, navVisible: true, navLabel: "Overview", navSection: "Monitor", navShort: "OV" },
  { path: "/servers", title: "Servers", requiresAuth: true, navVisible: true, navLabel: "Servers", navSection: "Monitor", navShort: "SV" },
  { path: "/servers/nodes", title: "VPN Nodes", requiresAuth: true, navVisible: false },
  { path: "/telemetry", title: "Telemetry", requiresAuth: true, navVisible: true, navLabel: "Telemetry", navSection: "Monitor", navShort: "TM" },
  { path: "/customer-360", title: "Customer 360", requiresAuth: true, navVisible: true, navLabel: "Customer 360", navSection: "Customers", navShort: "C3" },
  { path: "/users", title: "Users", requiresAuth: true, navVisible: true, navLabel: "Users", navSection: "Customers", navShort: "US" },
  { path: "/devices", title: "Devices", requiresAuth: true, navVisible: true, navLabel: "Devices", navSection: "Customers", navShort: "DV" },
  { path: "/automation", title: "Automation", requiresAuth: true, navVisible: true, navLabel: "Automation", navSection: "Monitor", navShort: "AT" },
  { path: "/revenue", title: "Revenue", requiresAuth: true, navVisible: true, navLabel: "Revenue", navSection: "Monitor", navShort: "RV" },
  { path: "/billing", title: "Billing", requiresAuth: true, navVisible: true, navLabel: "Billing", navSection: "Customers", navShort: "BL" },
  { path: "/audit", title: "Audit Log", requiresAuth: true, navVisible: true, navLabel: "Audit Log", navSection: "Monitor", navShort: "AU" },
  { path: "/news", title: "News", requiresAuth: true, navVisible: true, navLabel: "News", navSection: "Config", navShort: "NW" },
  { path: "/settings", title: "Settings", requiresAuth: true, navVisible: true, navLabel: "Settings", navSection: "Config", navShort: "ST" },
  { path: "/styleguide", title: "Styleguide", requiresAuth: true, navVisible: false },
];

const routeMetaByPath = new Map(ROUTES_META.map((meta) => [meta.path, meta]));

export function resolveRouteMeta(pathname: string): RouteMeta | undefined {
  const exact = routeMetaByPath.get(pathname);
  if (exact) return exact;

  const nested = ROUTES_META.find(
    (meta) => meta.path !== "/" && pathname.startsWith(`${meta.path}/`)
  );

  return nested;
}

export function getRouteTitle(pathname: string): string {
  return resolveRouteMeta(pathname)?.title ?? "Overview";
}

export function getSidebarRoutes(section: NavSection): RouteMeta[] {
  return ROUTES_META.filter(
    (route) => route.navVisible && route.navSection === section
  );
}
