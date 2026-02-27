import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  LayoutGrid,
  Server,
  Users,
  Cpu,
  Activity,
  Workflow,
  FileText,
  CreditCard,
  Settings,
  Palette,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { Button, Select, PageContainer } from "@vpn-suite/shared/ui";
import { useTheme } from "@vpn-suite/shared/theme";
import { useAuthStore } from "../store/authStore";
import { CommandPalette } from "../components/CommandPalette";
import type { CommandItem } from "../components/CommandPalette";
import { useServerListFull } from "../hooks/useServerList";
import { HealthBar, LiveStatusBlock } from "../components/operator";
import { selectTimeseriesForChart } from "../domain/dashboard";
import { ResourceDebugPanel } from "../components/ResourceDebugPanel";
import { TelemetryDebugPanel } from "../components/TelemetryDebugPanel";
import { useOperatorStrip } from "../domain/dashboard";

interface NavItem {
  to: string;
  label: string;
  short: string;
  section?: string;
  icon: LucideIcon;
}

const allNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", short: "OV", section: "CONTROL", icon: LayoutGrid },
  { to: "/servers", label: "Servers", short: "SV", section: "CONTROL", icon: Server },
  { to: "/telemetry", label: "Telemetry", short: "TM", section: "CONTROL", icon: Activity },
  { to: "/users", label: "Users", short: "US", section: "ACCESS", icon: Users },
  { to: "/devices", label: "Devices", short: "DV", section: "ACCESS", icon: Cpu },
  { to: "/automation", label: "Automation", short: "AT", section: "NETWORK", icon: Workflow },
  { to: "/billing", label: "Billing", short: "BL", section: "SYSTEM", icon: CreditCard },
  { to: "/audit", label: "Audit log", short: "AU", section: "SYSTEM", icon: FileText },
  { to: "/settings", label: "Settings", short: "ST", section: "SYSTEM", icon: Settings },
  { to: "/styleguide", label: "Style guide", short: "SG", section: "SYSTEM", icon: Palette },
];

const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

const navItems = allNavItems.filter(
  (item) => item.to !== "/styleguide" || isDev
);

const mobileNavItems = navItems.filter(
  (item) =>
    ["/", "/servers", "/users", "/telemetry", "/settings"].includes(item.to) &&
    (item.to !== "/" || item.label === "Dashboard")
);

const REGION_STORAGE_KEY = "vpn-suite-admin-region";

const SIDEBAR_COLLAPSED_KEY = "vpn-suite-sidebar-collapsed";

function getInitialSidebarCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    const w = window.innerWidth;
    return w >= 640 && w < 1024;
  }
  return false;
}

export function AdminLayout() {
  const [sidebarOpen, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    const fromUrl = new URLSearchParams(window.location.search).get("region");
    return fromUrl ?? localStorage.getItem(REGION_STORAGE_KEY) ?? "all";
  });
  const { theme, themes, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const chordRef = useRef<{ key: string; ts: number } | null>(null);
  const { data: serversData } = useServerListFull();

  const {
    data: operatorData,
    error: operatorError,
    isLoading: operatorLoading,
    refetch: refetchOperatorStrip,
  } = useOperatorStrip();
  const healthStrip = operatorData?.health_strip;

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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
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
      if (previous && previous.key === "g" && now - previous.ts < 1000) {
        const scoped = (path: string) =>
          activeRegion === "all"
            ? path
            : { pathname: path, search: `?region=${encodeURIComponent(activeRegion)}` };
        if (e.key === "s") {
          e.preventDefault();
          navigate(scoped("/servers"));
        } else if (e.key === "u") {
          e.preventDefault();
          navigate(scoped("/users"));
        } else if (e.key === "t") {
          e.preventDefault();
          navigate(scoped("/telemetry"));
        } else if (e.key === "a") {
          e.preventDefault();
          navigate(scoped("/automation"));
        } else if (e.key === "o") {
          e.preventDefault();
          navigate(scoped("/"));
        }
        chordRef.current = null;
        return;
      }
      if (e.key === "g") {
        chordRef.current = { key: "g", ts: now };
      } else {
        chordRef.current = null;
      }
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
    <div className="admin-layout" data-console="operator">
      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>
      <div className="admin-top-bar" role="banner">
        <div className="admin-top-bar-left">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {"\u2630"}
          </button>
          <NavLink to="/" className="admin-brand" aria-label="AmneziaWG Admin" end>
            <Shield className="admin-brand-icon" aria-hidden strokeWidth={1.5} />
            <span className="admin-brand-text">AmneziaWG</span>
          </NavLink>
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
          <span className="admin-env-badge" title="Environment">Prod</span>
        </div>
        <div className="admin-top-bar-center" aria-hidden />
        <div className="admin-top-bar-right">
          <LiveStatusBlock
            last_updated={healthStrip?.last_updated ?? new Date().toISOString()}
            freshness={healthStrip?.freshness ?? "unknown"}
            onRefresh={handleRefresh}
          />
          <Link
            to="/"
            className="admin-alerts-trigger"
            aria-label={operatorData?.incidents?.length ? `${operatorData.incidents.length} active incidents` : "Alerts"}
            title="View incidents"
          >
            <Bell className="admin-alerts-icon" aria-hidden size={14} strokeWidth={2} />
            {operatorData?.incidents && operatorData.incidents.length > 0 && (
              <span className={`admin-alerts-count ${operatorData.incidents.some((i) => i.severity === "critical") ? "admin-alerts-count--critical" : "admin-alerts-count--warning"}`}>
                {operatorData.incidents.length}
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
            <Search className="admin-search-icon" aria-hidden size={14} strokeWidth={2} />
            <span className="admin-search-label">Search</span>
          </button>
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme">
            {theme === "dark" ? <Sun size={14} strokeWidth={2} aria-hidden /> : <Moon size={14} strokeWidth={2} aria-hidden />}
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="admin-logout-btn" aria-label="Log out">
            Log out
          </Button>
        </div>
      </div>
      <div className="admin-health-bar" role="region" aria-label="System health">
        {healthStrip ? (
          <HealthBar
            data={healthStrip}
            timeseries={selectTimeseriesForChart(operatorData ?? null)}
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
      <div className="admin-body">
        <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`} data-testid="admin-sidebar">
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
            {sidebarCollapsed ? <ChevronRight size={14} aria-hidden /> : <ChevronLeft size={14} aria-hidden />}
          </button>
        </aside>
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
          <PageContainer>
            <Outlet />
          </PageContainer>
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
    </div>
  );
}
