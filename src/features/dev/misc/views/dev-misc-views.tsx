// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { IconCheckCircle, IconRefresh } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { ProfileSettingsPanel } from "@/shared/components/profile/profile-settings-panel";
import { getDevFlowDeveloper, updateDevFlowDeveloperCapacity } from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

export function DevSettingsView() {
  const { devFlowUser } = useAuth();
  const [capacity, setCapacity] = useState({
    skillsText: "",
    weeklyCapacityHours: "",
    availabilityStatus: "AVAILABLE",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadCapacity = async () => {
    if (!devFlowUser?.id) return;
    setLoading(true);
    setError("");
    try {
      const developer = await getDevFlowDeveloper(devFlowUser.id);
      setCapacity({
        skillsText: developer.skills.join(", "),
        weeklyCapacityHours: developer.weeklyCapacityHours == null ? "" : String(developer.weeklyCapacityHours),
        availabilityStatus: developer.availabilityStatus,
        notes: developer.notes || "",
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapacity();
  }, [devFlowUser?.id]);

  const saveCapacity = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const developer = await updateDevFlowDeveloperCapacity({
        skills: capacity.skillsText.split(",").map((skill) => skill.trim()).filter(Boolean),
        weeklyCapacityHours: capacity.weeklyCapacityHours === "" ? null : Number(capacity.weeklyCapacityHours),
        availabilityStatus: capacity.availabilityStatus,
        notes: capacity.notes.trim() || null,
      });
      setCapacity({
        skillsText: developer.skills.join(", "),
        weeklyCapacityHours: developer.weeklyCapacityHours == null ? "" : String(developer.weeklyCapacityHours),
        availabilityStatus: developer.availabilityStatus,
        notes: developer.notes || "",
      });
      setSaved(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-screen-label="Dev Settings" style={{ display: "grid", gap: 20 }}>
      <DevPageHeader
        title="Settings"
        subtitle="Profile preferences and developer capacity are persisted through backend APIs."
        actions={<Button variant="secondary" icon={<IconRefresh size={14} />} onClick={loadCapacity}>Refresh capacity</Button>}
      />

      <ProfileSettingsPanel title="Developer profile" subtitle="Update your display name and lightweight preferences." />

      <Card style={{ padding: 24 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Capacity</h3>
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>This is visible to PMs in the developer directory.</p>
          </div>
          {saved && <Badge tone="green">Saved</Badge>}
        </div>
        {error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 14 }}>{compactDevFlowError(error)}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Field label="Weekly capacity hours">
            <Input type="number" min="0" max="168" value={capacity.weeklyCapacityHours} onChange={(event) => setCapacity({ ...capacity, weeklyCapacityHours: event.target.value })} disabled={loading || saving} />
          </Field>
          <Field label="Availability">
            <Select value={capacity.availabilityStatus} onChange={(event) => setCapacity({ ...capacity, availabilityStatus: event.target.value })} disabled={loading || saving}>
              <option value="AVAILABLE">Available</option>
              <option value="LIMITED">Limited</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </Select>
          </Field>
          <Field label="Skills">
            <Input value={capacity.skillsText} onChange={(event) => setCapacity({ ...capacity, skillsText: event.target.value })} placeholder="React, NestJS, Prisma" disabled={loading || saving} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={3} value={capacity.notes} onChange={(event) => setCapacity({ ...capacity, notes: event.target.value })} placeholder="Availability notes" disabled={loading || saving} />
        </Field>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <Button variant="primary" icon={<IconCheckCircle size={14} />} disabled={loading || saving} onClick={saveCapacity}>
            {saving ? "Saving..." : "Save capacity"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
