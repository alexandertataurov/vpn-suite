export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error != null && typeof (error as { message?: string }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback ?? String(error ?? "Unknown error");
}
