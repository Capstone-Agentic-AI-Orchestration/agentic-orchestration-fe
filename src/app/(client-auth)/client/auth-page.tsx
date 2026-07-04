import { Suspense } from "react";
import { ClientAuthView } from "@/features/client/auth/views/client-auth-view";

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" | "forgot" | "reset" }) {
  return (
    <Suspense fallback={<div className="auth-route-state">Loading...</div>}>
      <ClientAuthView mode={mode} />
    </Suspense>
  );
}
