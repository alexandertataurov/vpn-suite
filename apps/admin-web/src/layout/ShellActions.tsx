import { useAuthStore } from "@/core/auth/store";
import { Avatar, Button } from "@/design-system/primitives";

export function ShellActions() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="shell-actions">
      <Avatar name="Operator" size="sm" color="blue" status="online" />
      <Button variant="ghost" onClick={logout} aria-label="Sign out">
        Sign out
      </Button>
    </div>
  );
}
