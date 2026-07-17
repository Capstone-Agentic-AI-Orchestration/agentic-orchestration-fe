import { Suspense } from "react";
import { PersonaSignInView } from "@/features/auth/persona-sign-in-view";

export default function DevSignInPage() {
  return (
    <Suspense fallback={<div className="auth-route-state">Loading...</div>}>
      <PersonaSignInView
        persona="DEV"
        title="Sign in to build"
        subtitle="Access your assigned repositories, live orchestration runs, and agent output. Use GitHub if you're a member of the developer team."
        homePath="/dev/dashboard"
        accent="#34D399"
      />
    </Suspense>
  );
}
