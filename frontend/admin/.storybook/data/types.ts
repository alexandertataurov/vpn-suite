export type UserRole = "Owner" | "Admin" | "Operator" | "SRE" | "Viewer";

export type UserStatus = "active" | "invited" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  joinedAt: string;
}

export type ProjectStatus = "active" | "paused" | "archived";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  owner: User;
  team: User[];
  priority: "low" | "medium" | "high";
  tags: string[];
}

export type ServerStatus = "online" | "offline" | "degraded" | "maintenance";

export interface Server {
  id: string;
  name: string;
  role: "core" | "edge";
  region: string;
  status: ServerStatus;
  version: string;
  lastSeen: string;
  cpuLoad: number;
  memoryUsage: number;
  activeTunnels: number;
}

export interface Cluster {
  id: string;
  name: string;
  region: string;
  health: "healthy" | "warning" | "critical";
  packetLoss: number;
  latencyMs: number;
  servers: Server[];
}

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: "monitoring" | "node" | "control-plane";
  startedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  affectedServers: string[];
}

export type NotificationType = "mention" | "incident" | "deployment" | "recovery" | "config";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  href?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href: string;
  badge?: string | null;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface TableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "right" | "center";
}

export type FormFieldType = "text" | "email" | "password" | "select" | "checkbox";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  hint?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormFieldConfig[];
}

export interface CommandItem {
  id: string;
  group: string;
  label: string;
  icon?: string;
  shortcut?: string[];
  href?: string;
}

export interface ToastActionConfig {
  label: string;
  onClick?: () => void;
}

export type ToastKind = "success" | "error" | "warning" | "info" | "undo";

export interface ToastScenario {
  title?: string;
  description?: string;
  action?: ToastActionConfig;
  kind: ToastKind;
}

export type DeviceStatus = "active" | "revoked";

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  issuedAt: string;
  shortId?: string;
}

export interface TelemetryPoint {
  timestamp: string;
  value: number;
}

export interface TelemetrySeries {
  id: string;
  label: string;
  unit: string;
  points: TelemetryPoint[];
}

export interface ErrorStateScenario {
  title: string;
  code: string | null;
  message: string;
  action: string;
}

export interface ActivityRow {
  id: string;
  action: string;
  status: "ok" | "degraded" | "down";
  owner: string;
}

export interface ServerRow {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  region: string;
}

