import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CommandPalette,
  DatePicker,
  Drawer,
  Input,
  Meter,
  Modal,
  Pagination,
  Popover,
  Progress,
  SegmentedMeter,
  Skeleton,
  Slider,
  Spinner,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Timeline,
  useToast,
} from "@/design-system";

export function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const indeterminateRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (indeterminateRef.current) indeterminateRef.current.indeterminate = true;
  }, []);

  const sampleRows = useMemo(
    () => [
      { name: "node-01", region: "eu-west", status: "online" },
      { name: "node-02", region: "us-east", status: "degraded" },
      { name: "node-03", region: "ap-sg", status: "offline" },
    ],
    []
  );

  const commandItems = useMemo(
    () => [
      {
        id: "deploy",
        icon: "⚡",
        label: "Deploy to production",
        description: "v2.4.1 → prod-us-east-1",
        tag: "Action",
      },
      {
        id: "metrics",
        icon: "📊",
        label: "View metrics dashboard",
        description: "Cluster overview",
        tag: "Navigate",
      },
      {
        id: "nodes",
        icon: "●",
        label: "node-prod-01",
        description: "us-east-1a · running",
        tag: "Node",
      },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter(
      (item) =>
        item.label.toString().toLowerCase().includes(q) ||
        (item.description && item.description.toString().toLowerCase().includes(q))
    );
  }, [commandItems, commandQuery]);

  return (
    <div className="page styleguide-page">
      <div className="flex items-baseline justify-between gap-4">
        <h2>Primitives Styleguide</h2>
        <Button variant="default" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
      </div>

      <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
        Visual regression surface for Primitives tokens + components.
      </p>

      <div className="mt-6 grid gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">Buttons</div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="solid">Solid</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm" variant="default">
                Small
              </Button>
              <Button size="md" variant="default">
                Medium
              </Button>
              <Button size="lg" variant="default">
                Large
              </Button>
              <Button iconOnly aria-label="Icon-only" variant="default">
                ⌘
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">
              Tabs / Accordion
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>
                  <TabsPanel value="overview">
                    Cluster overview · all regions nominal.
                  </TabsPanel>
                  <TabsPanel value="metrics">
                    p99 latency 142ms · error rate 0.3% · 4,821 RPS.
                  </TabsPanel>
                  <TabsPanel value="logs">Streaming logs from all nodes.</TabsPanel>
                </Tabs>
              </div>
              <div className="flex flex-col gap-3">
                <Accordion defaultValue="auth">
                  <AccordionItem value="auth" title="Authentication & API Keys" meta="3 keys">
                    Manage API keys for programmatic access. Rotate every 90 days.
                  </AccordionItem>
                  <AccordionItem value="network" title="Network Configuration" meta="vpc-0d8f">
                    Configure VPC settings, CIDR ranges, and security groups.
                  </AccordionItem>
                  <AccordionItem
                    value="observability"
                    title="Observability & Logging"
                    meta="⚠ 2 errors"
                  >
                    Stream logs to external providers and adjust retention.
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">Inputs</div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-[10px] font-[500] tracking-[0.1em] uppercase text-[var(--text-muted)]">
                Default
                <Input placeholder="Placeholder" />
              </label>
              <label className="flex flex-col gap-2 text-[10px] font-[500] tracking-[0.1em] uppercase text-[var(--text-muted)]">
                Error
                <Input error placeholder="Invalid" defaultValue="bad_value@" />
              </label>
              <label className="flex flex-col gap-2 text-[10px] font-[500] tracking-[0.1em] uppercase text-[var(--text-muted)]">
                Success
                <Input success placeholder="Valid" defaultValue="ok_value" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.14em] uppercase text-[var(--text-muted)]">Select</div>
                <div className="select-wrap w-full">
                  <select className="input w-full" defaultValue="">
                    <option value="">— choose environment</option>
                    <option>production</option>
                    <option>staging</option>
                    <option>development</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.14em] uppercase text-[var(--text-muted)]">Textarea</div>
                <textarea className="input" placeholder="Multi-line input..." rows={3} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">
              Meters / Timeline / Stepper
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Meter label="CPU (avg)" valueLabel="83%" percent={83} variant="warning" />
                <Meter label="Storage" valueLabel="67 / 100 GB" percent={67} variant="info" />
                <SegmentedMeter filled={7} total={10} variant="success" />
              </div>
              <div className="flex flex-col gap-4">
                <Stepper
                  steps={[
                    { id: "configure", label: "Configure", subLabel: "Done", state: "completed", marker: "✓" },
                    { id: "build", label: "Build", subLabel: "2m 14s", state: "completed", marker: "✓" },
                    { id: "deploy", label: "Deploy", subLabel: "In progress", state: "active" },
                    { id: "verify", label: "Verify", subLabel: "Waiting", state: "pending" },
                  ]}
                />
                <Timeline
                  events={[
                    {
                      id: "offline",
                      title: "node-prod-11 went offline",
                      time: "4m ago",
                      description: "Automatic failover initiated to node-prod-12.",
                      actor: "auto-failover · eu-west-1",
                      variant: "danger",
                    },
                    {
                      id: "cpu-alert",
                      title: "CPU alert triggered",
                      time: "9m ago",
                      description: "node-prod-07 >80% CPU for 5 minutes.",
                      actor: "alerting-service · #ops-alerts",
                      variant: "warning",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">
              Navigation / Identity / Controls
            </div>
            <div className="flex flex-col gap-3">
              <Breadcrumb>
                <BreadcrumbItem href="#">Home</BreadcrumbItem>
                <BreadcrumbItem href="#">Infrastructure</BreadcrumbItem>
                <BreadcrumbItem href="#">Clusters</BreadcrumbItem>
                <BreadcrumbItem>prod-us-east-1</BreadcrumbItem>
              </Breadcrumb>
              <div className="flex items-center gap-4">
                <Avatar name="Marina K." color="green" status="online" />
                <AvatarGroup>
                  <Avatar name="AB" color="blue" />
                  <Avatar name="CD" color="orange" />
                  <Avatar name="EF" color="red" />
                </AvatarGroup>
              </div>
              <div className="flex flex-col gap-2 max-w-[320px]">
                <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)]">
                  Slider / Date Picker
                </span>
                <Slider
                  value={sliderValue}
                  onChange={(event) => setSliderValue(Number(event.target.value))}
                />
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Replicas: {sliderValue}
                </span>
                <DatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>
              <div className="flex items-center gap-4">
                <Pagination page={page} pageCount={18} onPageChange={setPage} />
                <span className="text-[10px] text-[var(--text-muted)]">
                  Page {page} of 18
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">
              Overlays / Toasts / Popover
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
              <Button variant="default" onClick={() => setDrawerOpen(true)}>
                Open drawer
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  showToast({
                    variant: "success",
                    title: "Deployment complete",
                    description: "All 12 nodes updated to v2.4.1.",
                  })
                }
              >
                Success toast
              </Button>
              <Button
                variant="warning"
                onClick={() =>
                  showToast({
                    variant: "warning",
                    title: "High CPU detected",
                    description: "node-prod-07 at 84% for 5 minutes.",
                    persistent: true,
                  })
                }
              >
                Warning toast
              </Button>
              <Button variant="default" onClick={() => setCommandOpen(true)}>
                Open command palette
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Popover trigger={<Button variant="default">Hover for node details</Button>}>
                <div className="popover-title">node-prod-07</div>
                <div className="popover-body">
                  Instance: <code>m6i.2xlarge</code>
                  <br />
                  Region: <code>us-west-2b</code>
                  <br />
                  Status: <span style={{ color: "var(--warning)" }}>Degraded</span>
                </div>
              </Popover>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">Controls</div>

            <div className="flex flex-wrap gap-6 items-start">
              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.14em] uppercase text-[var(--text-muted)]">Checkbox</div>
                <label className="checkbox-wrap">
                  <input type="checkbox" />
                  <span className="text-[11px] text-[var(--text-secondary)]">Unchecked</span>
                </label>
                <label className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span className="text-[11px] text-[var(--text-secondary)]">Checked</span>
                </label>
                <label className="checkbox-wrap">
                  <input ref={(el) => (indeterminateRef.current = el)} type="checkbox" />
                  <span className="text-[11px] text-[var(--text-secondary)]">Indeterminate</span>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.14em] uppercase text-[var(--text-muted)]">Radio</div>
                <label className="radio-wrap">
                  <input type="radio" name="styleguide-radio" defaultChecked />
                  <span className="text-[11px] text-[var(--text-secondary)]">Option A</span>
                </label>
                <label className="radio-wrap">
                  <input type="radio" name="styleguide-radio" />
                  <span className="text-[11px] text-[var(--text-secondary)]">Option B</span>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.14em] uppercase text-[var(--text-muted)]">Toggle</div>
                <label className="toggle-wrap">
                  <input type="checkbox" className="toggle-input" />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">Off</span>
                </label>
                <label className="toggle-wrap success">
                  <input type="checkbox" className="toggle-input" defaultChecked />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">Active</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">Badges / Tags / Alerts</div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="badge badge-md badge-neutral">Neutral</span>
              <span className="badge badge-md badge-success">
                <span className="dot pulse" />
                Online
              </span>
              <span className="badge badge-md badge-warning">Warning</span>
              <span className="badge badge-md badge-danger">Critical</span>
              <span className="badge-count neutral">4</span>
              <span className="badge-count danger">12</span>
              <span className="tag">env:production</span>
              <span className="tag">
                removable <span className="tag-remove" role="button" aria-label="Remove tag">×</span>
              </span>
            </div>
            <div className="grid gap-2">
              <div className="alert info">
                <span className="alert-icon">ℹ</span>
                <div className="alert-body">
                  <div className="alert-title">Info</div>
                  <div className="alert-desc">Deployment queued.</div>
                </div>
              </div>
              <div className="alert success">
                <span className="alert-icon">✓</span>
                <div className="alert-body">
                  <div className="alert-title">Success</div>
                  <div className="alert-desc">Config saved.</div>
                </div>
              </div>
              <div className="alert warning">
                <span className="alert-icon">⚠</span>
                <div className="alert-body">
                  <div className="alert-title">Warning</div>
                  <div className="alert-desc">Memory pressure rising.</div>
                </div>
              </div>
              <div className="alert danger">
                <span className="alert-icon">✕</span>
                <div className="alert-body">
                  <div className="alert-title">Critical</div>
                  <div className="alert-desc">Node unreachable.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <div className="text-[9px] font-[600] tracking-[0.14em] uppercase text-[var(--text-muted)]">
              Progress / Loading / Table
            </div>
            <div className="grid gap-2 max-w-[480px]">
              <Progress value={67} variant="info" />
              <Progress value={83} variant="warning" />
              <Progress indeterminate variant="info" />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Spinner />
              <Skeleton width={220} height={12} />
              <Skeleton width={120} height={12} />
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Region</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.region}</TableCell>
                    <TableCell>
                      {r.status === "online" ? (
                        <span className="badge badge-sm badge-success">
                          <span className="dot pulse" />
                          Online
                        </span>
                      ) : r.status === "degraded" ? (
                        <span className="badge badge-sm badge-warning">Degraded</span>
                      ) : (
                        <span className="badge badge-sm badge-danger">Offline</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal">
        <div className="grid gap-3">
          <p className="text-[12px] text-[var(--text-secondary)]">
            This modal is styled by Primitives tokens and global component CSS.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Drawer"
      >
        <p className="text-[12px] text-[var(--text-secondary)] mb-3">
          Side panel for node details or configuration.
        </p>
        <Meter label="CPU" valueLabel="84%" percent={84} variant="warning" />
      </Drawer>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        items={filteredCommands}
        onSelect={() => setCommandOpen(false)}
      />
    </div>
  );
}
