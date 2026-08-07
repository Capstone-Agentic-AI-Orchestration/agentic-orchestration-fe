"use client";

import { Card, Badge, Skeleton, EmptyState, Button } from "@/shared/components/ui";
import { type DevFlowRuntimeProvider } from "@/shared/api/devflow-api";

interface RuntimesProvidersSectionProps {
  providers: DevFlowRuntimeProvider[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  testingId: string | null;
  deletingId: string | null;
}

const statusColor = (status: string) => {
  switch (status) {
    case "connected":
    case "ok":
      return "green";
    case "error":
    case "failed":
      return "red";
    default:
      return "gray";
  }
};

export function RuntimesProvidersSection({
  providers,
  loading,
  error,
  onDelete,
  onTest,
  testingId,
  deletingId,
}: RuntimesProvidersSectionProps) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} h={100} r={8} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--text-error)", fontSize: 13, padding: 12, backgroundColor: "var(--bg-error)", borderRadius: 8 }}>
        Error loading providers: {error}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        title="No cloud providers added"
        description="Add an API key to use a cloud model. Keys are yours alone — stored encrypted and never shown again."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {providers.map(provider => (
        <Card key={provider.id} style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {provider.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
                {provider.provider}
                {provider.model && ` • ${provider.model}`}
              </div>
              {provider.baseUrl && (
                <div style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "monospace" }}>
                  {provider.baseUrl}
                </div>
              )}
            </div>
            <Badge tone={statusColor(provider.status)}>{provider.status}</Badge>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              onClick={() => onTest(provider.id)}
              disabled={testingId === provider.id}
              style={{ fontSize: 12 }}
            >
              {testingId === provider.id ? "Testing..." : "Test"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDelete(provider.id)}
              disabled={deletingId === provider.id}
              style={{ fontSize: 12, color: "var(--text-error)" }}
            >
              {deletingId === provider.id ? "Removing..." : "Remove"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
