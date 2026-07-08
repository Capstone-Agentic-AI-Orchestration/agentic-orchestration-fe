"use client";

import { ClientDashboardContentView } from "../view/client-dashboard-view";
import { useClientDashboardViewModel } from "../view-model/use-client-dashboard-view-model";

export function ClientDashboardView() {
  const vm = useClientDashboardViewModel();
  return <ClientDashboardContentView vm={vm} />;
}
