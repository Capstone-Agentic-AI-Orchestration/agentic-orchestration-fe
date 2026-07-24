"use client";

import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowLeft, IconCpu, IconExternalLink } from "@/shared/components/icons";
import type {
  DevProjectDetailFact,
  DevProjectDetailStat,
} from "../model/dev-project-detail";
import type { DevProjectDetailViewModel } from "../view-model/use-dev-project-detail-view-model";

export function DevProjectDetailContentView({
  vm,
}: {
  vm: DevProjectDetailViewModel;
}) {
  const repositoryUrl = vm.project.repoUrl;

  return (
    <div className="dev-project-overview" data-screen-label={vm.screenLabel}>
      <button className="dev-back-link" onClick={vm.actions.back}>
        <IconArrowLeft size={13} /> My projects
      </button>

      <div className="dev-project-overview-header">
        <div className="dev-project-identity">
          <div className="dev-project-avatar">{vm.initials}</div>
          <div>
            <div className="dev-project-id">
              Assigned project · <span className="mono">{vm.projectId}</span>
            </div>
            <h1>{vm.companyName}</h1>
            <div className="dev-project-badges">
              <Badge tone={vm.lifecycleBadge.tone}>{vm.lifecycleBadge.label}</Badge>
              <Badge tone={vm.statusBadge.tone}>{vm.statusBadge.label}</Badge>
              <Badge tone="purple">Developer</Badge>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<IconCpu size={14} />}
          onClick={vm.actions.openOrchestrator}
        >
          Open Orchestrator
        </Button>
      </div>

      <div className="dev-project-overview-stats">
        {vm.stats.map((stat) => (
          <ProjectStat key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="dev-project-overview-grid">
        <div className="dev-project-overview-main">
          <Card className="dev-overview-card">
            <span className="dev-section-kicker">Project brief</span>
            <h2>What you are building</h2>
            <p>{vm.brief}</p>
            <div className="dev-project-progress-summary">
              <div>
                <span>Delivery progress</span>
                <strong>{vm.progress}%</strong>
              </div>
              <div className="dev-progress-track" aria-label={`${vm.progress}% complete`}>
                <span
                  style={{
                    width: `${vm.progress}%`,
                    background: vm.progressColor,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="dev-overview-card">
            <div className="dev-overview-card-heading">
              <div>
                <span className="dev-section-kicker">Delivery team</span>
                <h2>Project members</h2>
              </div>
              <Badge tone="purple">{vm.developerCountLabel}</Badge>
            </div>
            {!vm.hasMembers ? (
              <div className="dev-muted-state">No members are assigned yet.</div>
            ) : (
              <div className="dev-member-list">
                {vm.members.map((member) => (
                  <div key={member.id} className="dev-member-row">
                    <div className="dev-member-avatar" style={{ background: member.color }}>
                      {member.initials}
                    </div>
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="dev-project-overview-side">
          <Card className="dev-overview-card">
            <span className="dev-section-kicker">Delivery facts</span>
            <div className="dev-fact-list">
              {vm.facts.map((fact) => (
                <ProjectFact key={fact.label} fact={fact} />
              ))}
            </div>
            {repositoryUrl ? (
              <a
                className="dev-repository-link"
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open assigned repository <IconExternalLink size={13} />
              </a>
            ) : (
              <div className="dev-repository-unavailable">
                A repository has not been linked to this project.
              </div>
            )}
          </Card>

          <Card className="dev-overview-card dev-access-note">
            <span className="dev-section-kicker">Your access</span>
            <h2>Developer workspace</h2>
            <p>
              Project access is controlled by your project manager. Tasks, handoffs,
              artifacts, and messages remain scoped to this assignment.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProjectStat({ stat }: { stat: DevProjectDetailStat }) {
  return (
    <Card className="dev-project-stat">
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
    </Card>
  );
}

function ProjectFact({ fact }: { fact: DevProjectDetailFact }) {
  return (
    <div className="dev-fact-row">
      <span>{fact.label}</span>
      <strong className="mono">{fact.value}</strong>
    </div>
  );
}
