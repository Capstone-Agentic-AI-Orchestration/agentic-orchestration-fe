// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Select } from "@/shared/components/ui";
import { IconCheckCircle, IconRefresh, IconUser } from "@/shared/components/icons";
import { getCurrentDevFlowProfile, updateCurrentDevFlowProfile } from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

export function ProfileSettingsPanel({
  title = "Profile",
  subtitle = "Your profile is persisted on the backend.",
  accent = "linear-gradient(135deg,#4F8BFF,#8B5CF6)",
}) {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [uiDensity, setUiDensity] = useState("comfortable");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const nextProfile = await getCurrentDevFlowProfile();
      setProfile(nextProfile);
      setFullName(nextProfile.fullName || "");
      setEmailNotifications(Boolean(nextProfile.preferences?.emailNotifications ?? true));
      setUiDensity(String(nextProfile.preferences?.uiDensity || "comfortable"));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const initials = useMemo(() => {
    const source = fullName || profile?.email || "User";
    return source
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  }, [fullName, profile]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const nextProfile = await updateCurrentDevFlowProfile({
        fullName: fullName.trim(),
        preferences: {
          ...(profile?.preferences || {}),
          emailNotifications,
          uiDensity,
        },
      });
      setProfile(nextProfile);
      setSaved(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 24 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
        <div className="row gap-3">
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: accent, display: "grid", placeItems: "center", color: "white", fontWeight: 800 }}>
            {loading ? <IconUser size={18} /> : initials}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>{subtitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<IconRefresh size={13} />} disabled={loading || saving} onClick={load}>
          Refresh
        </Button>
      </div>

      {error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 14 }}>{compactDevFlowError(error)}</div>}
      {saved && <div style={{ color: "#6EE7B7", fontSize: 12.5, marginBottom: 14 }}>Settings saved.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Field label="Full name">
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" disabled={loading || saving} />
        </Field>
        <Field label="Email">
          <Input value={profile?.email || ""} readOnly disabled={loading} />
        </Field>
        <Field label="Role">
          <Input value={profile?.role || ""} readOnly disabled={loading} />
        </Field>
        <Field label="UI density">
          <Select value={uiDensity} onChange={(event) => setUiDensity(event.target.value)} disabled={loading || saving}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </Field>
      </div>

      <div className="row" style={{ justifyContent: "space-between", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <label className="row gap-2" style={{ color: "var(--text-2)", fontSize: 13 }}>
          <input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} disabled={loading || saving} />
          Email notifications
        </label>
        <div className="row gap-2">
          {profile?.status && <Badge tone={profile.status === "ACTIVE" ? "green" : "red"}>{profile.status}</Badge>}
          <Button variant="primary" icon={<IconCheckCircle size={14} />} disabled={loading || saving || !fullName.trim()} onClick={save}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
