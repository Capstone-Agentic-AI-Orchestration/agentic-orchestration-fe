"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@/shared/components/ui";
import { IconFolder, IconRefresh } from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { ProjectConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

export function DevMessagesView() {
  const router = useRouter();
  const {
    projects,
    projectsLoading,
    projectsError,
    refreshProjects,
    selectedProjectId,
    selectedProject,
    selectedProjectLoading,
    selectedProjectError,
  } = useSelectedDevFlowProject();

  const error = projectsError || selectedProjectError;

  return (
    <div className="dev-workspace-page dev-messages-page" data-screen-label="Dev - Messages">
      <DevPageHeader
        title="Messages"
        subtitle="Coordinate decisions, blockers, and delivery details directly with your project manager."
        actions={(
          <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={refreshProjects}>
            Refresh projects
          </Button>
        )}
      />

      {error ? (
        <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>
          <div style={{ fontWeight: 700 }}>Messages are unavailable</div>
          <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 5 }}>{compactDevFlowError(error)}</div>
        </Card>
      ) : projectsLoading || (selectedProjectId && selectedProjectLoading) ? (
        <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading the selected project workspace...</Card>
      ) : projects.length === 0 || !selectedProjectId ? (
        <Card style={{ padding: 22 }}>
          <div style={{ fontWeight: 700 }}>No assigned project</div>
          <div style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>
            A project manager must add this developer account to a project before team messages are available.
          </div>
          <Button variant="secondary" size="sm" icon={<IconFolder size={13} />} style={{ marginTop: 14 }} onClick={() => router.push("/dev/projects")}>
            Open projects
          </Button>
        </Card>
      ) : !selectedProject ? (
        <Card style={{ padding: 22, color: "var(--text-3)" }}>The selected project is not available to this developer account.</Card>
      ) : (
        <>
          <Card style={{ padding: 16 }}>
            <div style={{ color: "var(--text-3)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em" }}>Selected project</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{selectedProject.companyName}</div>
            <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>
              This TEAM workspace is for communication between developers and the project manager. Clients cannot access it.
            </div>
          </Card>
          <ProjectConversationPanel
            projectId={selectedProjectId}
            title="Project manager inbox"
            subtitle="Project-scoped TEAM threads"
            defaultVisibility="TEAM"
            defaultCategory="GENERAL"
            emptyText="No project-manager conversations yet. Start the first thread for this project."
          />
        </>
      )}
    </div>
  );
}
