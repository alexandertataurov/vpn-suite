// Why: keep only envelope-level API contracts here; domain models stay in feature/workspace types.
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  meta?: ApiResponseMeta;
}

export interface ApiResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

