import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  Cluster,
  CommandItem,
  Device,
  FormStep,
  Notification,
  Project,
  Server,
  TelemetrySeries,
  ToastScenario,
  User,
} from "./types";

const userNames = [
  "Amara Osei",
  "Marcus Chen",
  "Lena Hofmann",
  "Diego Alvarez",
  "Priya Nair",
  "Jonah Berg",
  "Sara Kim",
  "Fatima Haddad",
  "Noah Lindgren",
  "Aisha Rahman",
] as const;

const userRoles = ["Owner", "Admin", "Operator", "SRE", "Viewer"] as const;

const userStatuses = ["active", "invited", "suspended"] as const;

const regions = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-south-1"] as const;

const serverRoles = ["core", "edge"] as const;

const serverStatuses = ["online", "offline", "degraded", "maintenance"] as const;

const alertSeverities = ["info", "warning", "critical"] as const;

const alertStatuses = ["open", "acknowledged", "resolved"] as const;

const avatarBase = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

const lastActiveSamples = ["2 minutes ago", "10 minutes ago", "1 hour ago", "yesterday", "3 days ago"] as const;

const joinedAtSamples = ["2023-03-14", "2023-07-01", "2024-01-10", "2024-06-21"] as const;

export function generateUsers(count: number): User[] {
  return Array.from({ length: count }, (_, index) => {
    const baseIndex = index % userNames.length;
    const [firstName] = userNames[baseIndex].split(" ");
    const role = userRoles[index % userRoles.length];
    const status = userStatuses[index % userStatuses.length];
    const lastActive = lastActiveSamples[index % lastActiveSamples.length];
    const joinedAt = joinedAtSamples[index % joinedAtSamples.length];
    const id = `usr_${String(index + 1).padStart(2, "0")}`;
    const email = `${firstName.toLowerCase()}.${index + 1}@acme-netops.com`;

    return {
      id,
      name: userNames[baseIndex],
      email,
      avatar: `${avatarBase}${encodeURIComponent(firstName.toLowerCase())}`,
      role,
      status,
      lastActive,
      joinedAt,
    };
  });
}

export function generateServers(count: number, users: User[]): Server[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `srv_${String(index + 1).padStart(3, "0")}`;
    const role = serverRoles[index % serverRoles.length];
    const region = regions[index % regions.length];
    const status = serverStatuses[index % serverStatuses.length];
    const version = `v1.${(index % 5) + 1}.0`;
    const lastSeen = index % 4 === 0 ? "2 minutes ago" : index % 4 === 1 ? "15 minutes ago" : "1 hour ago";
    const cpuLoad = 20 + (index * 7) % 60;
    const memoryUsage = 30 + (index * 11) % 60;
    const activeTunnels = 10 + (index * 13) % 500;

    return {
      id,
      name: `${role === "core" ? "core" : "edge"}-${region}-${String((index % 20) + 1).padStart(2, "0")}`,
      role,
      region,
      status,
      version,
      lastSeen,
      cpuLoad,
      memoryUsage,
      activeTunnels,
    };
  });
}

export function generateClusters(servers: Server[]): Cluster[] {
  return regions.map((region, index) => {
    const regionServers = servers.filter((s) => s.region === region);
    const unhealthy = regionServers.filter((s) => s.status !== "online");
    const health: Cluster["health"] =
      unhealthy.length === 0 ? "healthy" : unhealthy.length < regionServers.length / 2 ? "warning" : "critical";

    return {
      id: `cl_${index + 1}`,
      name: `Cluster ${region}`,
      region,
      health,
      packetLoss: unhealthy.length ? 2 + unhealthy.length * 0.5 : 0.2,
      latencyMs: 20 + index * 10,
      servers: regionServers,
    };
  });
}

export function generateProjects(users: User[]): Project[] {
  const owners = users.slice(0, 5);
  return owners.map((owner, index) => {
    const id = `proj_${String(index + 1).padStart(2, "0")}`;
    const status: Project["status"] = index === 0 ? "active" : index === owners.length - 1 ? "paused" : "active";
    const progress = 40 + index * 10;
    const dueDate = `2024-0${index + 4}-30`;
    const team = users.slice(index, index + 4);
    const priority: Project["priority"] = index === 0 ? "high" : index % 2 === 0 ? "medium" : "low";
    const tags = index === 0 ? ["core", "control-plane"] : ["telemetry", "fleet"];

    return {
      id,
      name: index === 0 ? "Core VPN rollout" : index === 1 ? "Edge expansion" : "Observability hardening",
      status,
      progress,
      dueDate,
      owner,
      team,
      priority,
      tags,
    };
  });
}

export function generateNotifications(users: User[]): Notification[] {
  const base: Notification[] = [
    {
      id: "notif_01",
      type: "incident",
      title: "Edge cluster latency spiked",
      body: "p95 latency in eu-west-1 exceeded 400ms for 5 minutes.",
      timestamp: "3 minutes ago",
      read: false,
      avatar: users[1]?.avatar,
      href: "/telemetry/incidents/inc_001",
    },
    {
      id: "notif_02",
      type: "deployment",
      title: "Control plane updated",
      body: "vpn-control-plane v1.7.0 completed rollout in all regions.",
      timestamp: "25 minutes ago",
      read: false,
      avatar: users[0]?.avatar,
      href: "/deployments/ctrl/1.7.0",
    },
    {
      id: "notif_03",
      type: "recovery",
      title: "Packet loss recovered",
      body: "Packet loss in us-east-1 dropped below 0.5% for 10 minutes.",
      timestamp: "1 hour ago",
      read: true,
      avatar: users[2]?.avatar,
      href: "/telemetry/incidents/inc_000",
    },
    {
      id: "notif_04",
      type: "config",
      title: "New device policy saved",
      body: "Marcus Chen updated the default device session policy.",
      timestamp: "2 hours ago",
      read: true,
      avatar: users[3]?.avatar,
      href: "/settings/policies/devices",
    },
  ];

  return base;
}

export function generateAlerts(servers: Server[]): Alert[] {
  const alerts: Alert[] = [];

  servers.slice(0, 6).forEach((server, index) => {
    const severity: AlertSeverity = alertSeverities[index % alertSeverities.length];
    const status: AlertStatus = alertStatuses[index % alertStatuses.length];
    alerts.push({
      id: `alrt_${index + 1}`,
      title:
        severity === "critical"
          ? `Server ${server.name} is offline`
          : severity === "warning"
            ? `High CPU on ${server.name}`
            : `New tunnels spike on ${server.name}`,
      description:
        severity === "critical"
          ? `No heartbeat received from ${server.name} in ${server.region} for 10 minutes.`
          : severity === "warning"
            ? `CPU load on ${server.name} has been above 85% for 5 minutes.`
            : `Active tunnels on ${server.name} are 3x above the 7-day baseline.`,
      severity,
      status,
      source: index % 2 === 0 ? "monitoring" : "node",
      startedAt: "2024-03-10T10:00:00Z",
      acknowledgedAt: status !== "open" ? "2024-03-10T10:05:00Z" : undefined,
      resolvedAt: status === "resolved" ? "2024-03-10T10:20:00Z" : undefined,
      affectedServers: [server.id],
    });
  });

  return alerts;
}

export function generateTelemetrySeries(id: string, label: string, unit: string): TelemetrySeries {
  const points = Array.from({ length: 12 }, (_, index) => {
    const timestamp = `2024-03-10T${String(10 + Math.floor(index / 2))
      .padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}:00Z`;
    const base = 50 + index * 5;
    const value = unit === "ms" ? base + (index % 3) * 10 : base + (index % 4) * 3;
    return { timestamp, value };
  });

  return { id, label, unit, points };
}

export function generateDevices(count: number): Device[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `dev_${String(index + 1).padStart(2, "0")}`;
    const status: Device["status"] = index % 5 === 0 ? "revoked" : "active";
    return {
      id,
      name: `Engineer laptop ${index + 1}`,
      status,
      issuedAt: "2024-01-15",
      shortId: `id${String(index + 1).padStart(3, "0")}`,
    };
  });
}

export function generateOnboardingSteps(): FormStep[] {
  return [
    {
      id: "account",
      title: "Create your operator account",
      description: "Set up your work email and baseline access for the control plane.",
      fields: [
        { name: "firstName", label: "First name", type: "text", required: true },
        { name: "lastName", label: "Last name", type: "text", required: true },
        { name: "email", label: "Work email", type: "email", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          hint: "Use at least 12 characters with a mix of letters, numbers, and symbols.",
        },
      ],
    },
    {
      id: "environment",
      title: "Define your first environment",
      description: "Create a production or staging environment to group servers and policies.",
      fields: [
        { name: "environmentName", label: "Environment name", type: "text", required: true },
        { name: "region", label: "Primary region", type: "select", required: true, hint: "Where most of your traffic originates." },
      ],
    },
    {
      id: "node",
      title: "Connect your first node",
      description: "Install the VPN node agent on a server and register it with the control plane.",
      fields: [
        { name: "hostname", label: "Hostname", type: "text", required: true },
        { name: "role", label: "Node role", type: "select", required: true, hint: "Core nodes terminate tunnels; edge nodes sit closer to users." },
      ],
    },
    {
      id: "alerts",
      title: "Configure alerting",
      description: "Decide when the team should be notified about incidents and who gets paged.",
      fields: [
        { name: "primaryChannel", label: "Primary channel", type: "select", required: true },
        { name: "pagerDutyService", label: "PagerDuty service", type: "text" },
      ],
    },
    {
      id: "team",
      title: "Invite your team",
      description: "Add SREs, operators, and security engineers who will manage the VPN fleet.",
      fields: [
        { name: "teamEmails", label: "Team member emails", type: "text", hint: "Separate multiple emails with commas." },
      ],
    },
  ];
}

export function buildToastScenarios(): Record<string, ToastScenario> {
  return {
    success: {
      kind: "success",
      title: "Changes saved",
      description: "Your server settings have been updated across all regions.",
      action: { label: "View activity", onClick: () => {} },
    },
    error: {
      kind: "error",
      title: "Failed to save changes",
      description: "We could not reach the control plane. Check your connection and try again.",
      action: { label: "Retry", onClick: () => {} },
    },
    warning: {
      kind: "warning",
      title: "Approaching bandwidth limit",
      description: "You have used 90% of your committed bandwidth this month.",
    },
    info: {
      kind: "info",
      title: "Scheduled maintenance",
      description: "We will perform control plane maintenance on Sunday at 02:00 UTC.",
    },
    undo: {
      kind: "undo",
      title: "3 devices revoked",
      description: "Recently revoked devices will lose access within a few minutes.",
      action: { label: "Undo revoke", onClick: () => {} },
    },
  };
}

