import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Server } from "lucide-react";
import { Input, Checkbox, Button, Field, FormStack, Panel } from "@vpn-suite/shared/ui";
import { PageHeader } from "../components/PageHeader";
import type { ServerOut } from "@vpn-suite/shared/types";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@vpn-suite/shared";
import { useToast } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { ButtonLink } from "../components/ButtonLink";

export function ServerNewPage() {
  const [serverId, setServerId] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [presharedKey, setPresharedKey] = useState("");
  const [isActive, setIsActive] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const mutation = useMutation({
    mutationFn: (body: { id?: string; name?: string; region?: string; api_endpoint: string; public_key: string; preshared_key?: string; is_active: boolean }) =>
      api.post<ServerOut>("/servers", body),
    onSuccess: () => {
      addToast("Server added", "success");
      navigate("/servers");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Failed"), "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id: serverId.trim() || undefined,
      name: name || undefined,
      region: region || undefined,
      api_endpoint: apiEndpoint,
      public_key: publicKey,
      preshared_key: presharedKey.trim() || undefined,
      is_active: isActive,
    });
  };

  return (
    <div className="ref-page" data-testid="server-new-page">
      <PageHeader
        icon={Server}
        title="Add Server"
        description="Create a new VPN node for the fleet"
      />

      <Panel as="section" variant="outline">
        <form onSubmit={handleSubmit}>
          <FormStack>
          <Field
            id="server-id"
            label="Server ID (optional, for agent mode)"
            description="Set SERVER_ID to this in node-agent so only this server appears. 1–32 chars, e.g. vpn-node-1"
          >
            <Input id="server-id" value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder="vpn-node-1" />
          </Field>
          <Field id="server-name" label="Name (optional)" description="Friendly label for this node">
            <Input id="server-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="server-region" label="Region (optional)" description="e.g. us-east, eu-west">
            <Input id="server-region" value={region} onChange={(e) => setRegion(e.target.value)} />
          </Field>
          <Field id="server-api" label="API endpoint" description="Base URL for the node API">
            <Input id="server-api" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} required />
          </Field>
          <Field
            id="server-public-key"
            label="Public key (WireGuard / AmneziaWG)"
            description="Server public key from wireguard or amneziawg"
          >
            <Input
              id="server-public-key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="WireGuard public key"
              required
            />
          </Field>
          <Field
            id="server-preshared-key"
            label="Preshared key (optional)"
            description="WireGuard preshared key for issued configs"
          >
            <Input
              id="server-preshared-key"
              type="password"
              value={presharedKey}
              onChange={(e) => setPresharedKey(e.target.value)}
              placeholder="Base64 key"
            />
          </Field>
          <Checkbox
            label="Active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <div className="ref-page-actions">
            <Button type="submit" loading={mutation.isPending}>Add server</Button>
            <ButtonLink to="/servers" variant="ghost">Cancel</ButtonLink>
          </div>
          </FormStack>
        </form>
      </Panel>
    </div>
  );
}
