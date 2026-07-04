"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDevFlowProject, getDevFlowOrchestrationStatus } from "@/shared/api/devflow-api";
import { determineStepFromStatus } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export default function OrchestratorRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [project, status] = await Promise.all([
          getDevFlowProject(projectId),
          getDevFlowOrchestrationStatus(projectId).catch(() => null),
        ]);
        if (!active) return;
        const recommendedStep = determineStepFromStatus(project, status);
        router.replace(`/pm/orchestrate/${projectId}/${recommendedStep}`);
      } catch {
        if (!active) return;
        router.replace(`/pm/orchestrate/${projectId}/brief`);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, router]);

  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div className="skeleton" style={{ height: 120, borderRadius: 12, maxWidth: 600, margin: "0 auto" }} />
      <p style={{ marginTop: 16, color: "var(--text-3)", fontSize: "0.875rem" }}>
        {loading ? "Loading orchestration wizard…" : "Redirecting…"}
      </p>
    </div>
  );
}
