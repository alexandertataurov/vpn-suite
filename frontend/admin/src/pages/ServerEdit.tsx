import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Server } from "lucide-react";
import { Input, Checkbox, Button, PageError, Skeleton, Field, FormStack, Panel } from "@vpn-suite/shared/ui";
import { PageHeader } from "../components/PageHeader";
import type { ServerOut } from "@vpn-suite/shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serverKey } from "../api/query-keys";
import { ApiError, getErrorMessage } from "@vpn-suite/shared";
import { useToast } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { SERVERS_LIST_KEY, CONNECTION_NODES_KEY, OVERVIEW_KEY } from "../api/query-keys";
import { ButtonLink } from "../components/ButtonLink";

export function ServerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [presharedKey, setPresharedKey] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading, error, refetch } = useQuery<ServerOut>({
    queryKey: serverKey(id!),
    queryFn: ({ signal }) => api.get<ServerOut>(`/servers/${id}`, { signal }),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setRegion(data.region ?? "");
      setApiEndpoint(data.api_endpoint ?? "");
      setPublicKey(data.public_key ?? "");
      setPresharedKey(data.preshared_key ?? "");
      setIsActive(data.is_active ?? true);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: { name?: string; region?: string; api_endpoint: string; public_key: string; preshared_key?: string; is_active: boolean }) =>
      api.patch<ServerOut>(`/servers/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serverKey(id!) });
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: CONNECTION_NODES_KEY });
      queryClient.invalidateQueries({ queryKey: OVERVIEW_KEY });
      addToast("Server updated", "success");
      navigate("/servers");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Failed"), "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: name || undefined,
      region: region || undefined,
      api_endpoint: apiEndpoint,
      public_key: publicKey,
      preshared_key: presharedKey.trim() || undefined,
      is_active: isActive,
    });
  };

  if (error) {
    return (
      <div className="ref-page" data-testid="server-edit-page">
        <PageHeader backTo={`/servers/${id}`} backLabel="Server" icon={Server} title="Edit Server" />
        <PageError
          message={getErrorMessage(error, "Failed to load server")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /servers/:id"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="ref-page" data-testid="server-edit-page">
        <PageHeader backTo={`/servers/${id}`} backLabel="Server" icon={Server} title="Edit Server" />
        <Skeleton height={220} />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="server-edit-page">
      <PageHeader
        backTo={`/servers/${id}`}
        backLabel="Server"
        icon={Server}
        title="Edit Server"
        description={data.name ?? data.id.slice(0, 8)}
      />

      <Panel as="section" variant="outline">
        <form onSubmit={handleSubmit}>
          <FormStack>
          <Field id="edit-name" label="Name (optional)">
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="edit-region" label="Region (optional)">
            <Input id="edit-region" value={region} onChange={(e) => setRegion(e.target.value)} />
          </Field>
          <Field id="edit-api" label="API endpoint">
            <Input id="edit-api" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} required />
          </Field>
          <Field id="edit-public-key" label="Public key">
            <Input id="edit-public-key" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} required />
          </Field>
          <Field id="edit-preshared-key" label="Preshared key (optional)" description="WireGuard preshared key for issued configs">
            <Input id="edit-preshared-key" type="password" value={presharedKey} onChange={(e) => setPresharedKey(e.target.value)} placeholder="Base64 key" />
          </Field>
          <Checkbox
            label="Active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <div className="ref-page-actions">
            <Button type="submit" loading={mutation.isPending}>Save</Button>
            <ButtonLink to="/servers" variant="ghost">Cancel</ButtonLink>
          </div>
          </FormStack>
        </form>
      </Panel>
    </div>
  );
}
