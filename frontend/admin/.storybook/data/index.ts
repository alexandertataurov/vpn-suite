import type {
  ActivityRow,
  Alert,
  Cluster,
  CommandItem,
  Device,
  ErrorStateScenario,
  FormStep,
  NavSection,
  Notification,
  Project,
  Server,
  ServerRow,
  TableColumn,
  TelemetrySeries,
  ToastScenario,
  User,
} from "./types";
import {
  buildToastScenarios,
  generateAlerts,
  generateClusters,
  generateDevices,
  generateNotifications,
  generateOnboardingSteps,
  generateProjects,
  generateServers,
  generateTelemetrySeries,
  generateUsers,
} from "./generators";

export interface EmptyStateScenario {
  title: string;
  description: string;
  primary?: string;
  secondary?: string;
}

export const users: User[] = generateUsers(20);

export const projects: Project[] = generateProjects(users);

export const servers: Server[] = generateServers(24, users);

export const clusters: Cluster[] = generateClusters(servers);

export const appNavigation: NavSection[] = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", href: "/dashboard", badge: null },
      { id: "fleet", label: "Fleet", icon: "Server", href: "/fleet", badge: "12" },
      { id: "telemetry", label: "Telemetry", icon: "Activity", href: "/telemetry", badge: null },
      { id: "alerts", label: "Alerts", icon: "Bell", href: "/alerts", badge: "3" },
      { id: "sessions", label: "Sessions", icon: "Clock", href: "/sessions", badge: null },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "environments", label: "Environments", icon: "Globe2", href: "/settings/environments", badge: null },
      { id: "policies", label: "Policies", icon: "ShieldCheck", href: "/settings/policies", badge: null },
      { id: "integrations", label: "Integrations", icon: "Plug", href: "/settings/integrations", badge: null },
      { id: "billing", label: "Billing", icon: "CreditCard", href: "/settings/billing", badge: null },
    ],
  },
];

export const notifications: Notification[] = generateNotifications(users);

export const alerts: Alert[] = generateAlerts(servers);

export const telemetrySeries: TelemetrySeries[] = [
  generateTelemetrySeries("latency", "p95 latency", "ms"),
  generateTelemetrySeries("packet_loss", "Packet loss", "%"),
  generateTelemetrySeries("tunnels", "Active tunnels", "count"),
];

export const onboardingSteps: FormStep[] = generateOnboardingSteps();

export const devices: Device[] = generateDevices(8);

export const commandItems: CommandItem[] = [
  { id: "nav-dashboard", group: "Navigation", label: "Go to dashboard", icon: "LayoutDashboard", shortcut: ["G", "D"], href: "/dashboard" },
  { id: "nav-fleet", group: "Navigation", label: "Go to fleet", icon: "Server", shortcut: ["G", "F"], href: "/fleet" },
  { id: "nav-telemetry", group: "Navigation", label: "Go to telemetry", icon: "Activity", shortcut: ["G", "T"], href: "/telemetry" },
  { id: "nav-alerts", group: "Navigation", label: "Go to alerts", icon: "Bell", shortcut: ["G", "A"], href: "/alerts" },
  { id: "action-new-server", group: "Actions", label: "Register new server", icon: "Plus", shortcut: ["C", "S"] },
  { id: "action-invite", group: "Actions", label: "Invite operator", icon: "UserPlus", shortcut: ["C", "O"] },
  { id: "action-open-incident", group: "Actions", label: "Open latest incident", icon: "AlertTriangle", shortcut: ["I"] },
];

export const toastScenarios: Record<string, ToastScenario> = buildToastScenarios();

export const userTableColumns: TableColumn<User>[] = [
  { id: "name", label: "Name", sortable: true },
  { id: "email", label: "Email", sortable: true },
  { id: "role", label: "Role", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "lastActive", label: "Last active", sortable: true },
];

export const serverTableColumns: TableColumn<Server>[] = [
  { id: "name", label: "Server", sortable: true },
  { id: "region", label: "Region", sortable: true },
  { id: "role", label: "Role", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "activeTunnels", label: "Active tunnels", sortable: true },
];

export const errorStateScenarios: ErrorStateScenario[] = [
  { title: "Page not found", code: "404", message: "The page you're looking for doesn't exist or was moved.", action: "Go to dashboard" },
  { title: "Something went wrong", code: "500", message: "The server encountered an error. Our team has been notified.", action: "Retry" },
  { title: "You're offline", code: null, message: "Check your internet connection and try again.", action: "Retry" },
  { title: "Permission denied", code: "403", message: "You don't have access to this resource. Contact your admin for access.", action: "Go back" },
  { title: "Session expired", code: null, message: "Your session has expired. Please sign in again.", action: "Sign in" },
];

export const activityTableData: ActivityRow[] = [
  { id: "1", action: "Patch rollout", status: "ok", owner: "ops" },
  { id: "2", action: "Edge drain", status: "degraded", owner: "sre" },
  { id: "3", action: "Key rotation", status: "ok", owner: "sec" },
];

export const serverTableData: ServerRow[] = [
  { id: "1", name: "core-01", status: "online", region: "us-east" },
  { id: "2", name: "edge-22", status: "degraded", region: "eu-west" },
  { id: "3", name: "core-07", status: "offline", region: "ap-south" },
];

export const emptyStateScenarios: EmptyStateScenario[] = [
  {
    title: "No projects yet",
    description: "Create a project to start adding VPN nodes and managing regions.",
    primary: "Create project",
  },
  {
    title: "No search results",
    description: "No servers match \"core-prod-99\". Check the name or clear the search.",
    secondary: "Clear search",
  },
  {
    title: "No notifications",
    description: "You're all caught up. Notifications will appear here when alerts fire or deployments complete.",
  },
  {
    title: "No team members",
    description: "Invite your first team member to collaborate on this project.",
    primary: "Invite member",
  },
  {
    title: "Upload your first file",
    description: "Import server configs from a CSV or JSON file to bulk-add nodes.",
    primary: "Upload file",
    secondary: "Download template",
  },
  {
    title: "Connect your first integration",
    description: "Link Slack, PagerDuty, or webhooks to get alerts and deployment notifications.",
    primary: "Connect integration",
  },
];

