export interface AuditListParams {
  limit: number;
  offset: number;
  resourceType?: string;
  resourceId?: string;
  requestId?: string;
}

export function buildAuditPath(params: AuditListParams): string {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit));
  qs.set("offset", String(params.offset));
  if (params.resourceType?.trim()) qs.set("resource_type", params.resourceType.trim());
  if (params.resourceId?.trim()) qs.set("resource_id", params.resourceId.trim());
  if (params.requestId?.trim()) qs.set("request_id", params.requestId.trim());
  return `/audit?${qs.toString()}`;
}

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (path: string) => [...auditKeys.lists(), path] as const,
};
