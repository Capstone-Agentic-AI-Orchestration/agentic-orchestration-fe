"use client";

import type { ReactNode } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconArrowLeft,
  IconCpu,
} from "@/shared/components/icons";
import type {
  DevProjectDetailFact,
  DevProjectDetailStat,
} from "../model/dev-project-detail";
import type { DevProjectDetailViewModel } from "../view-model/use-dev-project-detail-view-model";

export function DevProjectDetailContentView({
  vm,
  workOrders,
  tasks,
  timeline,
  artifacts,
}: {
  vm: DevProjectDetailViewModel;
  workOrders: ReactNode;
  tasks: ReactNode;
  timeline: ReactNode;
  artifacts: ReactNode;
}) {
  return (
    <div data-screen-label={vm.screenLabel}>
      <button onClick={vm.actions.back} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <IconArrowLeft size={12} /> My projects
      </button>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        <div className="row gap-4" style={{ alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>{vm.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>Backend project - <span className="mono">{vm.projectId}</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0, margin: "3px 0 6px" }}>{vm.companyName}</h1>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <Badge tone={vm.lifecycleBadge.tone}>{vm.lifecycleBadge.label}</Badge>
              <Badge tone={vm.statusBadge.tone}>{vm.statusBadge.label}</Badge>
              <span style={{ padding: "2px 10px", borderRadius: 999, background: "rgba(168,85,247,.15)", color: "#C4B5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(168,85,247,.30)" }}>My role: Developer</span>
            </div>
          </div>
        </div>
        <div className="row gap-2">
          <Button variant="primary" size="sm" icon={<IconCpu size={13} />} onClick={vm.actions.openOrchestrator}>Open orchestrator</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
        {vm.stats.map((stat) => (
          <BackendWorkspaceStat key={stat.label} stat={stat} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18 }}>
        <Card style={{ padding: 22 }}>
          <Badge tone="blue">Assigned backend project</Badge>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Project brief</h3>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>{vm.brief}</p>
          <div style={{ marginTop: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-2)", fontSize: 12 }}>Backend progress</span>
              <span className="mono" style={{ color: "white", fontSize: 12 }}>{vm.progress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(8,14,32,.7)" }}>
              <div style={{ width: `${vm.progress}%`, height: "100%", borderRadius: 999, background: vm.progressColor }} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 10 }}>Delivery facts</h4>
          {vm.facts.map((fact) => (
            <DevFact key={fact.label} fact={fact} />
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18, marginTop: 18 }}>
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 12 }}>Team members</h3>
          {!vm.hasMembers ? (
            <div style={{ color: "var(--text-3)", fontSize: 13 }}>No members assigned yet.</div>
          ) : vm.members.map((member) => (
            <div key={member.id} className="row gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: member.color, color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{member.initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{member.role}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 18, background: "linear-gradient(135deg, rgba(168,85,247,.08), rgba(79,139,255,.04))" }}>
          <h4 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Developer access</h4>
          <p style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
            This page is visible because this account is assigned through project membership. Developers can inspect delivery state without PM-only edit controls.
          </p>
          <Badge tone="purple">{vm.developerCountLabel}</Badge>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18, marginTop: 18 }}>
        <div style={{ display: "grid", gap: 18 }}>
          {workOrders}
          {tasks}
        </div>
        {timeline}
      </div>

      <div style={{ marginTop: 18 }}>
        {artifacts}
      </div>
    </div>
  );
}

function BackendWorkspaceStat({ stat }: { stat: DevProjectDetailStat }) {
  return (
    <Card style={{ padding: 12, background: "rgba(8,14,32,.45)" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>Backend</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{stat.label}: {stat.value}</div>
    </Card>
  );
}

function DevFact({ fact }: { fact: DevProjectDetailFact }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{fact.label}</span>
      <span className="mono" style={{ color: "white", fontSize: 11.5, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{fact.value}</span>
    </div>
  );
}
