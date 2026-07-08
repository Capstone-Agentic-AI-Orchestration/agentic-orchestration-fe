import type {
  DevFlowProjectDetail,
  DevFlowProjectMember,
} from "@/shared/api/devflow-api";
import {
  devflowLifecycleView,
  devflowStatusView,
  formatDevFlowDate,
  lifecycleProgressColor,
  projectInitials,
} from "@/shared/utils/devflow-projects";

export interface DevProjectDetailStat {
  label: string;
  value: string;
}

export interface DevProjectDetailFact {
  label: string;
  value: string;
}

export interface DevProjectMemberRow {
  id: string;
  initials: string;
  name: string;
  role: string;
  color: string;
  member: DevFlowProjectMember;
}

export interface DevProjectDetailModel {
  screenLabel: string;
  projectId: string;
  companyName: string;
  initials: string;
  statusBadge: {
    tone: string;
    label: string;
  };
  lifecycleBadge: {
    tone: string;
    label: string;
  };
  progress: number;
  progressColor: string;
  brief: string;
  developerCountLabel: string;
  stats: DevProjectDetailStat[];
  facts: DevProjectDetailFact[];
  members: DevProjectMemberRow[];
  hasMembers: boolean;
}

export function buildDevProjectMemberRows(project: DevFlowProjectDetail): DevProjectMemberRow[] {
  return project.members.map((member) => ({
    id: member.id,
    initials: projectInitials(member.user.fullName || member.user.email),
    name: member.user.fullName || member.user.email || member.user.id,
    role: member.role,
    color: member.role === "DEV"
      ? "linear-gradient(135deg,#A855F7,#EC4899)"
      : "linear-gradient(135deg,#4F8BFF,#8B5CF6)",
    member,
  }));
}

export function buildDevProjectDetailModel(project: DevFlowProjectDetail): DevProjectDetailModel {
  const status = devflowStatusView(project.status);
  const lifecycle = devflowLifecycleView(project);
  const devMembers = project.members.filter((member) => member.role === "DEV");

  return {
    screenLabel: `Dev - Backend Project - ${project.id}`,
    projectId: project.id,
    companyName: project.companyName,
    initials: projectInitials(project.companyName),
    statusBadge: status,
    lifecycleBadge: {
      tone: lifecycle.tone,
      label: lifecycle.label,
    },
    progress: lifecycle.progress,
    progressColor: lifecycleProgressColor(lifecycle.tone),
    brief: project.brief,
    developerCountLabel: `${devMembers.length} developers assigned`,
    stats: [
      { label: "Stack", value: project.stackKey },
      { label: "Next", value: lifecycle.nextAction },
      { label: "Artifacts", value: String(project._count.artifacts) },
      { label: "Events", value: String(project._count.eventLogs) },
    ],
    facts: [
      { label: "Created", value: formatDevFlowDate(project.createdAt) },
      { label: "Updated", value: formatDevFlowDate(project.updatedAt) },
      { label: "Run", value: project.runId || "Not started" },
      { label: "Repo", value: project.repoUrl || "Not linked" },
    ],
    members: buildDevProjectMemberRows(project),
    hasMembers: project.members.length > 0,
  };
}
