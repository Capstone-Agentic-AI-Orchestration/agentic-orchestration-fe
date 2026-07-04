import { AdminConsoleShell } from "@/shared/components/admin/admin-console-shell";
import { RequireAuth } from "@/shared/auth/require-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allowedRoles={["ADMIN"]}>
      <AdminConsoleShell>{children}</AdminConsoleShell>
    </RequireAuth>
  );
}
