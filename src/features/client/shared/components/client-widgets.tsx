// @ts-nocheck
"use client";

import { Card } from "@/shared/components/ui";
import { IconCheck } from "@/shared/components/icons";

const STAGES = [
  { key: "INTAKE", label: "Intake", tint: "#4F8BFF" },
  { key: "SCOPING", label: "Scoping", tint: "#8B5CF6" },
  { key: "BUILD", label: "Build", tint: "#10B981" },
  { key: "REVIEW", label: "Review", tint: "#F59E0B" },
  { key: "DELIVERED", label: "Delivered", tint: "#22C55E" },
];

export function ClientStatusPill({ tone = "blue", children }) {
  const tones = {
    blue: { bg: "rgba(59,130,246,.12)", fg: "#93C5FD", dot: "#3B82F6", anim: true },
    green: { bg: "rgba(16,185,129,.12)", fg: "#6EE7B7", dot: "#10B981" },
    amber: { bg: "rgba(245,158,11,.12)", fg: "#FBBF24", dot: "#F59E0B" },
    red: { bg: "rgba(239,68,68,.12)", fg: "#FCA5A5", dot: "#EF4444" },
    gray: { bg: "rgba(148,163,184,.10)", fg: "#CBD5E1", dot: "#64748B" },
  };
  const t = tones[tone] || tones.blue;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: t.bg, color: t.fg, fontSize: 12.5, fontWeight: 600, border: `1px solid ${t.dot}33` }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.dot, boxShadow: `0 0 8px ${t.dot}`, animation: t.anim ? "pulseDot 1.6s ease-in-out infinite" : "none" }} />
      {children}
    </span>
  );
}

export function KPICard({ label, value, sub, icon, tint = "#4F8BFF", children }) {
  return (
    <Card style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tint}22`, color: tint, display: "grid", placeItems: "center", border: `1px solid ${tint}44` }}>{icon}</div>
        {sub && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{sub}</span>}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ color: "var(--text-2)", fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 0, marginTop: 4 }}>{value}</div>
      </div>
      {children}
    </Card>
  );
}

export function MiniStageTracker({ currentKey }) {
  const currentIdx = STAGES.findIndex((stage) => stage.key === currentKey);
  return (
    <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
      {STAGES.map((stage, index) => {
        const done = index < currentIdx;
        const active = index === currentIdx;
        return (
          <div key={stage.key} title={stage.label} style={{ flex: 1, height: 5, borderRadius: 3, background: done ? stage.tint : active ? `linear-gradient(90deg, ${stage.tint}, ${stage.tint}66)` : "var(--border)", boxShadow: active ? `0 0 10px ${stage.tint}88` : "none" }} />
        );
      })}
    </div>
  );
}

export function StageTimeline({ currentKey, dense = false }) {
  const currentIdx = STAGES.findIndex((stage) => stage.key === currentKey);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 22, right: 22, top: dense ? 16 : 22, height: 2, background: "var(--border)", borderRadius: 2 }} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 8, position: "relative" }}>
        {STAGES.map((stage, index) => {
          const done = index < currentIdx;
          const active = index === currentIdx;
          const size = dense ? 32 : 44;
          return (
            <div key={stage.key} style={{ textAlign: "center" }}>
              <div style={{ width: size, height: size, borderRadius: "50%", background: done ? `linear-gradient(135deg, ${stage.tint}, ${stage.tint}cc)` : active ? `radial-gradient(circle at 30% 30%, ${stage.tint}, ${stage.tint}aa)` : "rgba(15,23,42,.95)", border: `1px solid ${active ? stage.tint : done ? `${stage.tint}99` : "var(--border)"}`, color: done || active ? "white" : "var(--text-3)", display: "grid", placeItems: "center", margin: "0 auto", fontWeight: 700, fontSize: dense ? 12 : 14, boxShadow: active ? `0 0 0 6px ${stage.tint}22` : "none", position: "relative", zIndex: 1 }}>
                {done ? <IconCheck size={14} stroke={3} /> : index + 1}
              </div>
              <div style={{ fontWeight: active ? 600 : 500, fontSize: dense ? 12 : 13, marginTop: 10, color: active ? "white" : done ? "var(--text-2)" : "var(--text-3)" }}>{stage.label}</div>
              {active && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>In progress</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AvatarCircle({ initials, color, size = 40, online }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "grid", placeItems: "center", color: "white", fontWeight: 600, fontSize: size * 0.35, flexShrink: 0, position: "relative" }}>
      {initials}
      {online && <span style={{ position: "absolute", right: -2, bottom: -2, width: 11, height: 11, borderRadius: "50%", background: "var(--green)", border: "2px solid #0F172A" }} />}
    </div>
  );
}
