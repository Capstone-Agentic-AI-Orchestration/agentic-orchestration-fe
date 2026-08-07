import { Suspense } from "react";
import { PMClientsWorkspaceView } from "@/features/pm/clients/views/pm-clients-workspace-view";

export default function PMClientsPage() {
  // The active section lives in ?tab=, and useSearchParams needs a boundary to prerender against.
  return (
    <Suspense fallback={null}>
      <PMClientsWorkspaceView />
    </Suspense>
  );
}
