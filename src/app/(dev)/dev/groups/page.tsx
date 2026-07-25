import { Suspense } from "react";
import { DevGroupsView } from "@/features/dev/groups/views/dev-groups-view";

export default function DevGroupsPage() {
  return (
    <Suspense fallback={<div className="dev-muted-state">Loading teams…</div>}>
      <DevGroupsView />
    </Suspense>
  );
}
