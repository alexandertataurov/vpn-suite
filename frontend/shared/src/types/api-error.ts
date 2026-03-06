type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export interface ApiErrorBodyEnvelope {
  success: false;
  data: null;
  error: { code: string; message: string; details?: Record<string, unknown> };
  meta: { timestamp: string; code: number; request_id?: string; correlation_id?: string };
}

export interface ApiErrorBodyFlat {
  code: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
  request_id?: string;
  correlation_id?: string;
}

export type ApiErrorBody = ApiErrorBodyEnvelope | ApiErrorBodyFlat;

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value)) return false;

  // admin-style envelope: { success:false, error:{code,message}, meta:{code:number} }
  if ("success" in value && (value as { success?: unknown }).success === false) {
    const err = (value as { error?: unknown }).error;
    const meta = (value as { meta?: unknown }).meta;
    if (!isRecord(err) || !isRecord(meta)) return false;
    return (
      typeof (err as { code?: unknown }).code === "string" &&
      typeof (err as { message?: unknown }).message === "string" &&
      typeof (meta as { code?: unknown }).code === "number"
    );
  }

  // miniapp-style flat error: { code, message, status_code }
  return (
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string" &&
    typeof (value as { status_code?: unknown }).status_code === "number"
  );
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
    public readonly requestId?: string,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromBody(body: ApiErrorBody): ApiError {
    // Why: backend responses are not fully uniform across surfaces yet; support both shapes during consolidation.
    if ("success" in body) {
      return new ApiError(
        body.error.code,
        body.error.message,
        body.meta.code,
        body.error.details,
        body.meta.request_id,
        body.meta.correlation_id
      );
    }
    return new ApiError(
      body.code,
      body.message,
      body.status_code,
      body.details,
      body.request_id,
      body.correlation_id
    );
  }
}

