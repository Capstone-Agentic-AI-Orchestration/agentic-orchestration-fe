import { DevConsoleShell } from "@/features/dev/shared/components/dev-console-shell";
import { RequireAuth } from "@/shared/auth/require-auth";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allowedRoles={["DEV"]}>
      <DevConsoleShell>{children}</DevConsoleShell>
    </RequireAuth>
  );
}
