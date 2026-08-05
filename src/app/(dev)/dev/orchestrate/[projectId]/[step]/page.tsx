"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyOrchestratorStepRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.replace(`/dev/orchestrate/${projectId}`);
  }, [projectId, router]);

  return (
    <div className="orchestrator-redirect" role="status">
      Opening the current project stage…
    </div>
  );
}
