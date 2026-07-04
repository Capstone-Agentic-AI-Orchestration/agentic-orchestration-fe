import { ClientConsoleShell } from "@/features/client/shared/components/client-console-shell";
import { RequireAuth } from "@/shared/auth/require-auth";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allowedRoles={["CLIENT"]}>
      <ClientConsoleShell>{children}</ClientConsoleShell>
    </RequireAuth>
  );
}
