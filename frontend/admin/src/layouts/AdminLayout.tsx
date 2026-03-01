import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  IconShield,
  IconDashboard,
  IconServer,
  IconUsers,
  IconDevices,
  IconTelemetry,
  IconWorkflow,
  IconAuditLog,
  IconSubscriptions,
  IconSettings,
  IconPalette,
  IconBell,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconSun,
  IconMoon,
  IconTrend,
  type LucideIcon,
} from "@/design-system/icons";
import { Button, Select } from "@/design-system";
import {
  AppShell,
  MissionBar,
  NavRail,
  PageContent,
  BootSequence,
  CommandPalette,
  type CommandItem,
  HealthBar,
  LiveStatusBlock,
  SystemHeartbeat,
  ResourceDebugPanel,
  TelemetryDebugPanel,
  AvionicsBreadcrumbs,
} from "@/components";
import { useTheme } from "@vpn-suite/shared/theme";
import { useAuthStore } from "../store/authStore";
import { useServerListFull } from "../hooks/useServerList";
import { selectTimeseriesForChart } from "../domain/dashboard";
import { useOperatorStrip } from "../domain/dashboard";
import { useDensity } from "../context/DensityContext";

interface NavItem {
  to: string;
  label: string;
  short: string;
  section?: string;
  icon: LucideIcon;
}

const allNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", short: "OV", section: "CONTROL", icon: IconDashboard },
  { to: "/servers", label: "Servers", short: "SV", section: "CONTROL", icon: IconServer },
  { to: "/telemetry", label: "Telemetry", short: "TM", section: "CONTROL", icon: IconTelemetry },
  { to: "/users", label: "Users", short: "US", section: "ACCESS", icon: IconUsers },
  { to: "/devices", label: "Devices", short: "DV", section: "ACCESS", icon: IconDevices },
  { to: "/automation", label: "Automation", short: "AT", section: "NETWORK", icon: IconWorkflow },
  { to: "/revenue", label: "Revenue", short: "RV", section: "REVENUE", icon: IconTrend },
  { to: "/subscriptions-health", label: "Subscriptions", short: "SH", section: "REVENUE", icon: IconSubscriptions },
  { to: "/payments-monitor", label: "Payments", short: "PM", section: "REVENUE", icon: IconSubscriptions },
  { to: "/referrals", label: "Referrals", short: "RF", section: "REVENUE", icon: IconUsers },
  { to: "/abuse", label: "Abuse & Risk", short: "AB", section: "RISK", icon: IconShield },
  { to: "/retention", label: "Retention", short: "RT", section: "RISK", icon: IconBell },
  { to: "/pricing", label: "Pricing", short: "PR", section: "RISK", icon: IconTrend },
  { to: "/promos", label: "Promos", short: "PC", section: "RISK", icon: IconTrend },
  { to: "/churn", label: "Churn", short: "CH", section: "RISK", icon: IconTelemetry },
  { to: "/devops", label: "DevOps", short: "DO", section: "OPS", icon: IconServer },
  { to: "/cohorts", label: "Cohorts", short: "CO", section: "REVENUE", icon: IconDashboard },
  { to: "/billing", label: "Billing", short: "BL", section: "SYSTEM", icon: IconSubscriptions },
  { to: "/audit", label: "Audit log", short: "AU", section: "SYSTEM", icon: IconAuditLog },
  { to: "/settings", label: "Settings", short: "ST", section: "SYSTEM", icon: IconSettings },
  { to: "/styleguide", label: "Style guide", short: "SG", section: "SYSTEM", icon: IconPalette },
];

const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

const navItems = allNavItems.filter(
  (item) => item.to !== "/styleguide" || isDev
);

const mobileNavItems = [
  { to: "/", label: "DRASH", short: "DR" },
  { to: "/servers", label: "SRVR", short: "SV" },
  { to: "/telemetry", label: "BOTS", short: "BT" },
  { to: "/audit", label: "LOGS", short: "LG" },
  { to: "/settings", label: "SET", short: "ST" },
];

const REGION_STORAGE_KEY = "vpn-suite-admin-region";

const SIDEBAR_COLLAPSED_KEY = "vpn-suite-sidebar-collapsed";

function getInitialSidebarCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    /* ignore */
  }
  return true;
}

export function AdminLayout() {
  const [sidebarOpen, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [gridOverlay, setGridOverlay] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    const fromUrl = new URLSearchParams(window.location.search).get("region");
    return fromUrl ?? localStorage.getItem(REGION_STORAGE_KEY) ?? "all";
  });
  const { theme, themes, setTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const chordRef = useRef<{ key: string; ts: number } | null>(null);
  const gChordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: serversData } = useServerListFull();

  const {
    data: operatorPayload,
    incidents,
    error: operatorError,
    refetch: refetchOperatorStrip,
  } = useOperatorStrip();
  const healthStrip = operatorPayload?.health_strip;

  const regionOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const server of serversData?.items ?? []) {
      if (server.region) unique.add(server.region);
    }
    const list = Array.from(unique).sort((a, b) => a.localeCompare(b));
    return [{ value: "all", label: "All regions" }, ...list.map((r) => ({ value: r, label: r }))];
  }, [serversData?.items]);

  const scopedTo = (pathname: string) => {
    if (activeRegion === "all") return pathname;
    return { pathname, search: `?region=${encodeURIComponent(activeRegion)}` };
  };

  const navigateTo = useCallback(
    (path: string) => {
      const scoped =
        activeRegion === "all"
          ? path
          : { pathname: path, search: `?region=${encodeURIComponent(activeRegion)}` };
      navigate(scoped);
      setCommandOpen(false);
    },
    [navigate, activeRegion]
  );

  const toggleTheme = useCallback(() => {
    const idx = themes.indexOf(theme);
    const next = idx >= 0 ? themes[(idx + 1) % themes.length] : themes[0];
    if (next) setTheme(next);
    setCommandOpen(false);
  }, [theme, themes, setTheme]);

  const commandItems: CommandItem[] = useMemo(
    () => [
      ...navItems.map(({ to, label }) => ({
        id: to,
        label: to === "/" ? "Go to Dashboard" : `Go to ${label}`,
        keywords: label,
        onSelect: () => navigateTo(to),
      })),
      {
        id: "open-command-palette",
        label: "Open command palette",
        onSelect: () => setCommandOpen(true),
      },
      {
        id: "theme",
        label: "Switch theme",
        onSelect: toggleTheme,
      },
    ],
    [navigateTo, toggleTheme]
  );

  useEffect(() => {
    const isTypingContext = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingContext(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setCommandOpen(false);
        setOpen(false);
        chordRef.current = null;
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
        chordRef.current = null;
        return;
      }
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setCommandOpen(true);
        chordRef.current = null;
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setCommandOpen(true);
        chordRef.current = null;
        return;
      }
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setCommandOpen(true);
        chordRef.current = null;
        return;
      }

      const now = Date.now();
      const previous = chordRef.current;
      const chordMap: Record<string, string> = { s: "/servers", u: "/users", t: "/telemetry", a: "/automation", o: "/" };
      const chordPath = chordMap[e.key];
      if (previous?.key === "g" && now - previous.ts < 1000 && chordPath) {
        e.preventDefault();
        if (gChordTimerRef.current) clearTimeout(gChordTimerRef.current);
        gChordTimerRef.current = null;
        const scoped = (path: string) =>
          activeRegion === "all" ? path : { pathname: path, search: `?region=${encodeURIComponent(activeRegion)}` };
        navigate(scoped(chordPath));
        chordRef.current = null;
        return;
      }
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        chordRef.current = { key: "g", ts: now };
        if (gChordTimerRef.current) clearTimeout(gChordTimerRef.current);
        gChordTimerRef.current = setTimeout(() => {
          gChordTimerRef.current = null;
          chordRef.current = null;
          setGridOverlay((o) => !o);
        }, 350);
        return;
      }
      chordRef.current = e.key === "g" ? { key: "g", ts: now } : null;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigate, activeRegion]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get("region") ?? "all";
    setActiveRegion((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [location.search]);

  useEffect(() => {
    try {
      localStorage.setItem(REGION_STORAGE_KEY, activeRegion);
    } catch {
      /* ignore */
    }
  }, [activeRegion]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const handleRefresh = useCallback(() => {
    void refetchOperatorStrip();
  }, [refetchOperatorStrip]);

  const handleRegionChange = (region: string) => {
    setActiveRegion(region);
    const params = new URLSearchParams(location.search);
    if (region === "all") params.delete("region");
    else params.set("region", region);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  };

  let lastSection = "";

  return (
    <AppShell className={[gridOverlay ? "mission-control-grid-overlay" : "", density === "combat" ? "dashboard--combat" : "dashboard--comfortable"].filter(Boolean).join(" ")}>
      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>
      <div
        className={`admin-health-bar${!!operatorError || healthStrip?.api_status === "degraded" ? " admin-health-bar--api-degraded" : ""}`}
        role="region"
        aria-label="System health"
      >
        {healthStrip ? (
          <HealthBar
            data={healthStrip}
            timeseries={selectTimeseriesForChart(operatorPayload ?? null)}
          />
        ) : operatorError ? (
          <div className="operator-health-strip operator-health-strip--bar">
            <div className="operator-health-block operator-health-block--core operator-health-block--down">
              <div className="operator-health-bar-cell">
                <span className="operator-health-bar-label">API</span>
                <span className="operator-health-bar-value operator-topbar-value--down">Down</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="operator-health-strip operator-health-strip--bar">
            <div className="operator-health-block">
              <div className="operator-health-bar-cell">
                <span className="operator-health-bar-label">Status</span>
                <span className="operator-health-bar-value">…</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <MissionBar>
        <div className="mission-control-sweep" aria-hidden />
        <div className="admin-top-bar-left">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {"\u2630"}
          </button>
          <AvionicsBreadcrumbs
            missionName="VPN-NET-GLOBAL-01"
            current={
              navItems.find((n) => n.to === location.pathname)?.short ??
              (location.pathname.startsWith("/servers/") ? "NODE" :
               location.pathname.startsWith("/users/") ? "USER" : "SYS")
            }
          />
          <span className="admin-top-bar-sep" aria-hidden>|</span>
          <label className="admin-region-switch">
            <span className="admin-region-label">Region</span>
            <Select
              options={regionOptions}
              value={activeRegion}
              onChange={handleRegionChange}
              aria-label="Scope by region"
              className="admin-region-select"
            />
          </label>
          <span className="admin-env-badge" title="Environment">PROD</span>
        </div>
        <div className="admin-top-bar-center" role="region" aria-label="System Heartbeat">
          <SystemHeartbeat />
        </div>
        <div className="admin-top-bar-right">
          <LiveStatusBlock
            last_updated={healthStrip?.last_updated ?? new Date().toISOString()}
            freshness={healthStrip?.freshness ?? "unknown"}
            apiDegraded={!!operatorError || healthStrip?.api_status === "degraded"}
            onRefresh={handleRefresh}
          />
            <Link
              to="/"
              className="admin-alerts-trigger"
              aria-label={incidents.length ? `${incidents.length} active incidents` : "Alerts"}
              title="View incidents"
            >
              <IconBell className="admin-alerts-icon" aria-hidden size={14} strokeWidth={2} />
              {incidents.length > 0 && (
                <span className={`admin-alerts-count ${incidents.some((incident) => incident.severity === "critical") ? "admin-alerts-count--critical" : "admin-alerts-count--warning"}`}>
                  {incidents.length}
                </span>
              )}
            </Link>
          <button
            type="button"
            className="admin-search-trigger"
            onClick={() => setCommandOpen(true)}
            aria-label="Search (Ctrl+K)"
            title="Search (Ctrl+K)"
          >
            <IconSearch className="admin-search-icon" aria-hidden size={14} strokeWidth={1.5} />
            <span className="admin-search-label">Search</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDensity(density === "comfortable" ? "combat" : "comfortable")}
            aria-label="Toggle density"
            title="Density: Comfortable / Combat"
          >
            <span className="admin-density-label">{density === "comfortable" ? "COMF" : "COMBAT"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme">
            {theme === "dark" ? <IconSun size={14} strokeWidth={1.5} aria-hidden /> : <IconMoon size={14} strokeWidth={1.5} aria-hidden />}
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="admin-logout-btn" aria-label="Log out">
            Log out
          </Button>
        </div>
      </MissionBar>
      <div className="admin-body">
        <NavRail open={sidebarOpen} collapsed={sidebarCollapsed}>
          <nav className="admin-nav" aria-label="Main" data-testid="admin-nav">
            {navItems.map(({ to, label, section, icon: Icon }) => {
              const showSection = section && section !== lastSection;
              if (section) lastSection = section;
              return (
                <span key={`${to}-${label}`}>
                  {showSection ? (
                    <span className="admin-nav-section" aria-hidden>
                      {section}
                    </span>
                  ) : null}
                  <NavLink
                    to={scopedTo(to)}
                    end={to === "/"}
                    title={label}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="admin-nav-icon-svg" aria-hidden strokeWidth={1.5} />
                    <span className="admin-nav-label">{label}</span>
                  </NavLink>
                </span>
              );
            })}
          </nav>
          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {sidebarCollapsed ? <IconChevronRight size={14} strokeWidth={1.5} aria-hidden /> : <IconChevronLeft size={14} strokeWidth={1.5} aria-hidden />}
          </button>
        </NavRail>
        {sidebarOpen ? (
          <div
            className="admin-overlay"
            role="button"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            aria-label="Close menu"
          />
        ) : null}
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <PageContent>
            <BootSequence><Outlet /></BootSequence>
          </PageContent>
          {isDev ? <ResourceDebugPanel /> : null}
          {isDev ? <TelemetryDebugPanel /> : null}
        </main>
      </div>
      <nav className="admin-bottom-nav" aria-label="Mobile">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={scopedTo(item.to)}
            end={item.to === "/"}
            className={({ isActive }) => `admin-bottom-link ${isActive ? "active" : ""}`}
          >
            <span className="admin-bottom-icon" aria-hidden>{item.short}</span>
            <span className="admin-bottom-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} items={commandItems} />
    </AppShell>
  );
}
