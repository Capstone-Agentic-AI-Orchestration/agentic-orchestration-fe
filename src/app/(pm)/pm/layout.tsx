import { PMConsoleShell } from "@/features/pm/shared/components/pm-console-shell";
import { RequireAuth } from "@/shared/auth/require-auth";

export default function PMLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allowedRoles={["PM"]}>
      <PMConsoleShell>{children}</PMConsoleShell>
    </RequireAuth>
  );
}
