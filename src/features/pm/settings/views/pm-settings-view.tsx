// @ts-nocheck
"use client";

import { PMPageHeader } from "@/features/pm/shared/components/pm-page-header";
import { ProfileSettingsPanel } from "@/shared/components/profile/profile-settings-panel";

export function PMSettingsView() {
  return (
    <div data-screen-label="PM Settings" style={{ display: "grid", gap: 20 }}>
      <PMPageHeader
        title="Settings"
        subtitle="Current-user profile and lightweight preferences are persisted through the profile API."
      />
      <ProfileSettingsPanel
        title="Project manager profile"
        subtitle="Update your display name and workspace preferences."
        accent="linear-gradient(135deg,#4F8BFF,#8B5CF6)"
      />
    </div>
  );
}
