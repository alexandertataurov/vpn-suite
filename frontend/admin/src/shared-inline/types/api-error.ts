/** Backend unified error shape: { success, error: { code, message }, meta } */
export interface ApiErrorBody {
  success: false;
  data: null;
  error: { code: string; message: string; details?: Record<string, unknown> };
  meta: { timestamp: string; code: number; request_id?: string; correlation_id?: string };
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
    return new ApiError(
      body.error.code,
      body.error.message,
      body.meta.code,
      body.error.details,
      body.meta?.request_id,
      body.meta?.correlation_id
    );
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}
