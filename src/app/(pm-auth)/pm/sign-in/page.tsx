import { Suspense } from "react";
import { PersonaSignInView } from "@/features/auth/persona-sign-in-view";

export default function PmSignInPage() {
  return (
    <Suspense fallback={<div className="auth-route-state">Loading...</div>}>
      <PersonaSignInView
        persona="PM"
        title="Sign in to orchestrate"
        subtitle="Plan projects, run the delivery pipeline, and manage your teams. Use GitHub if you're a member of the project-manager team."
        homePath="/pm/projects"
        accent="#818CF8"
      />
    </Suspense>
  );
}
