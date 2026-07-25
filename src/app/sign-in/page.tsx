import { Suspense } from "react";
import { SignInView } from "@/features/auth/sign-in-view";

/**
 * The one and only sign-in page for the internal console. Role routing after
 * authentication forwards each user (DEV / PM / ADMIN) to their own workspace,
 * so there is no reason for per-persona login URLs.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-route-state">Loading...</div>}>
      <SignInView />
    </Suspense>
  );
}
