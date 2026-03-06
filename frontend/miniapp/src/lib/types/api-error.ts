export interface ApiErrorBody {
  code: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
  request_id?: string;
  correlation_id?: string;
}

export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "message" in data &&
    "status_code" in data
  );
}

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;
  readonly correlationId?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
    requestId?: string,
    correlationId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    this.correlationId = correlationId;
  }

  static fromBody(body: ApiErrorBody): ApiError {
    return new ApiError(
      body.code,
      body.message,
      body.status_code,
      body.details,
      body.request_id,
      body.correlation_id,
    );
  }
}
