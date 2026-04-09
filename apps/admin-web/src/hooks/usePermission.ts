/**
 * Purpose: Gate UI by capability (e.g. can_write, can_manage_dangerous from GET /app/settings).
 * Used in: Settings, dangerous actions. Stub: returns true until useAppSettings + capabilities are wired.
 */
export function usePermission(permission: string): boolean {
  void permission;
  return true;
}
