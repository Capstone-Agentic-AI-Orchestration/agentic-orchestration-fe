// @ts-nocheck
"use client";

import { PMPageHeader } from "@/features/pm/shared/components/pm-page-header";
import { OrchestrationModelDefaultsPanel } from "@/shared/components/orchestration/orchestration-model-defaults-panel";
import { ProfileSettingsPanel } from "@/shared/components/profile/profile-settings-panel";

export function PMSettingsView() {
  return (
    <div data-screen-label="PM Settings" style={{ display: "grid", gap: 20 }}>
      <PMPageHeader
        title="Settings"
        subtitle="Manage your profile and choose the default AI models used when new orchestration runs begin."
      />
      <OrchestrationModelDefaultsPanel />
      <ProfileSettingsPanel
        title="Project manager profile"
        subtitle="Update your display name and workspace preferences."
        accent="linear-gradient(135deg,#4F8BFF,#8B5CF6)"
      />
    </div>
  );
}
