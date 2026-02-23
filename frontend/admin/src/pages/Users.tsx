import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, MoreVertical, Search, Users } from "lucide-react";
import { Button, Drawer, EmptyState, FormStack, PageError, Pagination, RelativeTime, VirtualTable, CellCompound, CellAvatar, CellPrimary, CellMuted, useToast, PrimitiveBadge } from "@vpn-suite/shared/ui";
import type { DeviceList, UserOut, UserList } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { USERS_KEY, userKey } from "../api/query-keys";
import { useServerListForRegion } from "../hooks/useServerList";
import { ButtonLink } from "../components/ButtonLink";
import { PageHeader } from "../components/PageHeader";
import { userStatusToVariant, formatDate, getErrorMessage } from "@vpn-suite/shared";
import {
  loadSavedViews,
  removeSavedView,
  type SavedView,
  upsertSavedView,
} from "../utils/savedViews";

const LIMIT = 20;
const USERS_VIEWS_SCOPE = "users";

interface UsersViewState {
  searchQuery: string;
  sortKey: string;
  sortDir: "asc" | "desc";
}

function toTimestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function toInitial(user: UserOut): string {
  const seed = (user.email ?? "").trim();
  if (seed) return seed.charAt(0).toUpperCase();
  return String(user.id).charAt(0) || "U";
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(0);
  const qParam = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(qParam);
  useEffect(() => {
    setSearchQuery(qParam);
  }, [qParam]);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeUser, setActiveUser] = useState<UserOut | null>(null);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [savedViews, setSavedViews] = useState<SavedView<UsersViewState>[]>(() =>
    loadSavedViews<UsersViewState>(USERS_VIEWS_SCOPE)
  );
  const [selectedViewName, setSelectedViewName] = useState("");
  const regionFilter = searchParams.get("region") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";
  const planFilter = searchParams.get("plan") ?? "";
  const [planInput, setPlanInput] = useState(planFilter);
  useEffect(() => {
    setPlanInput(planFilter);
  }, [planFilter]);
  const queryLimit = regionFilter === "all" ? LIMIT : 200;

  const { data, isLoading, error, refetch } = useQuery<UserList>({
    queryKey: [...USERS_KEY, offset, searchTrigger, regionFilter, statusFilter, planFilter, qParam],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(queryLimit),
        offset: String(regionFilter === "all" ? offset : 0),
      });
      const value = qParam.trim();
      if (value) {
        if (/^\d+$/.test(value)) params.set("tg_id", value);
        else params.set("email", value);
      }
      if (regionFilter !== "all") params.set("region", regionFilter);
      if (statusFilter === "active") params.set("is_banned", "false");
      if (statusFilter === "banned") params.set("is_banned", "true");
      if (planFilter) params.set("plan_id", planFilter);
      return api.get<UserList>(`/users?${params.toString()}`, { signal });
    },
  });

  const serversQuery = useServerListForRegion(regionFilter, { enabled: true, refetchInterval: 60_000 });

  const devicesQuery = useQuery<DeviceList>({
    queryKey: [...USERS_KEY, "devices", regionFilter],
    queryFn: ({ signal }) => api.get<DeviceList>("/devices?limit=1000&offset=0", { signal }),
    staleTime: 30_000,
    enabled: regionFilter !== "all",
  });

  const blockMutation = useMutation({
    mutationFn: ({
      userId,
      confirmToken,
    }: {
      userId: number;
      confirmToken: string;
    }) =>
      api.patch(`/users/${userId}`, {
        is_banned: true,
        confirm_token: confirmToken,
      }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      queryClient.invalidateQueries({ queryKey: userKey(String(userId)) });
      setActiveUser(null);
      addToast("User blocked", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Block failed"), "error");
    },
  });

  const handleBlockUser = (user: UserOut) => {
    const token = window.prompt("Enter block confirmation token:");
    if (token) blockMutation.mutate({ userId: user.id, confirmToken: token });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearchTrigger((n) => n + 1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchQuery.trim()) next.set("q", searchQuery.trim());
      else next.delete("q");
      next.delete("offset");
      return next;
    }, { replace: true });
  };

  const setUrlFilters = (updates: { status?: string; plan?: string }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") next.set("status", updates.status);
        else next.delete("status");
      }
      if (updates.plan !== undefined) {
        if (updates.plan) next.set("plan", updates.plan);
        else next.delete("plan");
      }
      next.delete("offset");
      return next;
    }, { replace: true });
    setOffset(0);
    setSearchTrigger((n) => n + 1);
  };

  const scopedUsers = useMemo(() => {
    if (!data?.items?.length) return [];
    return data.items;
  }, [data?.items]);

  const serverLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const server of serversQuery.data?.items ?? []) {
      map.set(server.id, server.name ?? server.region ?? server.id.slice(0, 8));
    }
    return map;
  }, [serversQuery.data?.items]);

  const devicesCountByUser = useMemo(() => {
    const map = new Map<number, number>();
    for (const device of devicesQuery.data?.items ?? []) {
      map.set(device.user_id, (map.get(device.user_id) ?? 0) + 1);
    }
    return map;
  }, [devicesQuery.data?.items]);

  const primaryServerByUser = useMemo(() => {
    const map = new Map<number, string>();
    for (const device of devicesQuery.data?.items ?? []) {
      if (map.has(device.user_id)) continue;
      map.set(device.user_id, serverLabelById.get(device.server_id) ?? device.server_id.slice(0, 8));
    }
    return map;
  }, [devicesQuery.data?.items, serverLabelById]);

  const sortedUsers = useMemo(() => {
    const users = [...scopedUsers];
    users.sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;

      if (sortKey === "status") {
        return (Number(a.is_banned) - Number(b.is_banned)) * direction;
      }

      if (sortKey === "server") {
        const serverA = primaryServerByUser.get(a.id) ?? "";
        const serverB = primaryServerByUser.get(b.id) ?? "";
        return serverA.localeCompare(serverB) * direction;
      }

      if (sortKey === "created_at") {
        return (toTimestamp(a.created_at) - toTimestamp(b.created_at)) * direction;
      }

      if (sortKey === "updated_at") {
        const tsA = toTimestamp(a.updated_at ?? a.created_at);
        const tsB = toTimestamp(b.updated_at ?? b.created_at);
        return (tsA - tsB) * direction;
      }

      if (sortKey === "tg_id") {
        return ((a.tg_id ?? 0) - (b.tg_id ?? 0)) * direction;
      }

      if (sortKey === "email") {
        return (a.email ?? "").localeCompare(b.email ?? "") * direction;
      }

      return (a.id - b.id) * direction;
    });
    return users;
  }, [primaryServerByUser, scopedUsers, sortDir, sortKey]);

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const applySavedView = (name: string) => {
    setSelectedViewName(name);
    if (!name) return;
    const selected = savedViews.find((view) => view.name === name);
    if (!selected) return;
    setSearchQuery(selected.state.searchQuery);
    setSortKey(selected.state.sortKey);
    setSortDir(selected.state.sortDir);
    setOffset(0);
    setSearchTrigger((n) => n + 1);
  };

  const saveCurrentView = () => {
    const suggested = selectedViewName || "New users view";
    const name = window.prompt("Save users view as:", suggested)?.trim() ?? "";
    if (!name) return;
    const next = upsertSavedView<UsersViewState>(USERS_VIEWS_SCOPE, savedViews, {
      name,
      state: { searchQuery, sortKey, sortDir },
    });
    setSavedViews(next);
    setSelectedViewName(name);
  };

  const deleteCurrentView = () => {
    if (!selectedViewName) return;
    const confirmed = window.confirm(`Delete saved view "${selectedViewName}"?`);
    if (!confirmed) return;
    const next = removeSavedView<UsersViewState>(
      USERS_VIEWS_SCOPE,
      savedViews,
      selectedViewName
    );
    setSavedViews(next);
    setSelectedViewName("");
  };

  if (error) {
    return (
      <div className="ref-page" data-testid="users-page">
        <PageHeader icon={Users} title="Users" description="Manage users and subscriptions">
          <Button variant="secondary" size="sm" onClick={() => refetch()} aria-label="Retry">
            Retry
          </Button>
        </PageHeader>
        <PageError
          message={getErrorMessage(error, "Failed to load users")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /users"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="users-page">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage users and subscriptions"
      />

      <div className="ref-users-filters">
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setUrlFilters({ status: e.target.value })}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <input
          type="text"
          className="input ref-users-plan-input"
          placeholder="Plan ID"
          value={planInput}
          onChange={(e) => setPlanInput(e.target.value)}
          onBlur={() => setUrlFilters({ plan: planInput.trim() })}
          onKeyDown={(e) => e.key === "Enter" && setUrlFilters({ plan: planInput.trim() })}
          aria-label="Filter by plan"
        />
      </div>
      <form onSubmit={handleSearch} className="ref-users-toolbar">
        <div className="ref-users-search">
          <Search className="ref-search-icon" aria-hidden strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search users by Telegram ID or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input ref-search-input"
            aria-label="Search users"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled
          title="Users are created through subscription/device flow"
        >
          Add User
        </Button>
      </form>

      <div className="ref-users-views">
        <label htmlFor="users-view-select" className="ref-users-view-label">Saved views</label>
        <select
          id="users-view-select"
          className="input ref-users-view-select"
          value={selectedViewName}
          onChange={(e) => applySavedView(e.target.value)}
          aria-label="Apply saved users view"
        >
          <option value="">Select view</option>
          {savedViews.map((view) => (
            <option key={view.name} value={view.name}>
              {view.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="ghost" size="sm" onClick={saveCurrentView}>
          Save view
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!selectedViewName}
          onClick={deleteCurrentView}
        >
          Delete view
        </Button>
      </div>

      {sortedUsers.length === 0 && regionFilter === "all" && statusFilter === "all" && !planFilter && !qParam.trim() && !isLoading ? (
        <EmptyState
          icon={<Users strokeWidth={1.5} />}
          title="No users yet"
          description="Users will appear here when they sign up or are invited"
        />
      ) : (
        <VirtualTable<UserOut>
          columns={[
            {
              key: "user",
              header: "User",
              sortKey: "email",
              render: (user) => (
                <CellCompound>
                  <CellAvatar>{toInitial(user)}</CellAvatar>
                  <div>
                    <CellPrimary>{`user_${user.id}`}</CellPrimary>
                    <CellMuted>{user.email ?? "No email"}</CellMuted>
                  </div>
                </CellCompound>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortKey: "status",
              render: (user) => (
                <PrimitiveBadge variant={userStatusToVariant(user.is_banned ? "banned" : "active")} size="sm">
                  {user.is_banned ? "Banned" : "Active"}
                </PrimitiveBadge>
              ),
            },
            {
              key: "data_used",
              header: "Data Used",
              numeric: true,
              className: "table-cell-secondary",
              render: (user) => (devicesCountByUser.has(user.id) ? devicesCountByUser.get(user.id) : "—"),
            },
            {
              key: "server",
              header: "Server",
              sortKey: "server",
              render: (user) => primaryServerByUser.get(user.id) ?? "—",
            },
            {
              key: "last_seen",
              header: "Last Seen",
              sortKey: "updated_at",
              className: "table-cell-secondary",
              render: (user) =>
                user.updated_at || user.created_at ? (
                  <RelativeTime date={user.updated_at ?? user.created_at!} />
                ) : (
                  "—"
                ),
            },
            {
              key: "join_date",
              header: "Join Date",
              sortKey: "created_at",
              className: "table-cell-secondary",
              numeric: true,
              render: (user) => formatDate(user.created_at),
            },
            {
              key: "actions",
              header: "Actions",
              actions: true,
              render: (user) => (
                <div className="table-actions">
                  <ButtonLink
                    to={`/users/${user.id}`}
                    variant="ghost"
                    size="icon"
                    aria-label={`Open full profile for user ${user.id}`}
                  >
                    <ArrowUpRight className="ref-icon" aria-hidden strokeWidth={1.5} />
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveUser(user)}
                    aria-label={`Open quick panel for user ${user.id}`}
                  >
                    <MoreVertical className="ref-icon" aria-hidden strokeWidth={1.5} />
                  </Button>
                </div>
              ),
            },
          ]}
          data={sortedUsers}
          keyExtractor={(user) => user.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          loading={isLoading}
          emptyMessage="No users found"
          maxHeight={sortedUsers.length > 50 ? 480 : undefined}
          overscan={6}
        />
      )}

      {regionFilter === "all" && data && data.total > LIMIT ? (
        <Pagination offset={offset} limit={LIMIT} total={data.total} onPage={setOffset} />
      ) : null}

      <Drawer
        open={activeUser != null}
        onClose={() => setActiveUser(null)}
        title={activeUser != null ? `User #${activeUser.id}` : "User details"}
        width={460}
      >
        {activeUser != null ? (
          <FormStack>
            <p className="m-0"><strong>Telegram ID:</strong> {activeUser.tg_id ?? "Not linked"}</p>
            <p className="m-0"><strong>Email:</strong> {activeUser.email ?? "Not set"}</p>
            <p className="m-0"><strong>Phone:</strong> {activeUser.phone ?? "Not set"}</p>
            <p className="m-0"><strong>Status:</strong> {activeUser.is_banned ? "Banned" : "Active"}</p>
            <div className="actions-row ref-users-drawer-actions">
              <ButtonLink to={`/users/${activeUser.id}`} variant="secondary" size="sm">
                Open full profile
              </ButtonLink>
              <ButtonLink to={`/devices?user_id=${activeUser.id}`} variant="secondary" size="sm">
                View devices
              </ButtonLink>
              {!activeUser.is_banned && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBlockUser(activeUser)}
                  disabled={blockMutation.isPending}
                >
                  Block user
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveUser(null)}
              >
                Close panel
              </Button>
            </div>
          </FormStack>
        ) : null}
      </Drawer>
    </div>
  );
}
