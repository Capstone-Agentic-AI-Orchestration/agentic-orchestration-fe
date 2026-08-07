"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui";
import {
  createDevFlowRuntimePairingCode,
  createDevFlowRuntimeProvider,
  deleteDevFlowRuntimeProvider,
  listDevFlowRuntimeMachines,
  listDevFlowRuntimeProviders,
  revokeDevFlowRuntimeMachine,
  testDevFlowRuntimeProvider,
  type DevFlowRuntimeMachine,
  type DevFlowRuntimeProvider,
} from "@/shared/api/devflow-api";
import { useAdminResource } from "@/shared/components/admin/admin-live-views";
import { RuntimesMachinesSection } from "../components/runtimes-machines-section";
import { RuntimesProvidersSection } from "../components/runtimes-providers-section";
import { AddProviderModal } from "../components/add-provider-modal";
import { ConnectMachineModal } from "../components/connect-machine-modal";
import {
  pairLocalCompanion,
  probeLocalCompanion,
  type LocalCompanionInfo,
} from "../lib/local-companion";

/** Online/offline is only meaningful if it is reasonably fresh; the daemon beats every 30s. */
const REFRESH_MS = 15_000;

interface RuntimesState {
  machines: DevFlowRuntimeMachine[];
  providers: DevFlowRuntimeProvider[];
}

const loadRuntimes = async (): Promise<RuntimesState> => {
  const [machines, providers] = await Promise.all([
    listDevFlowRuntimeMachines(),
    listDevFlowRuntimeProviders(),
  ]);

  return { machines, providers };
};

/**
 * Two ways to give DevFlow model access, kept visibly separate because they differ in kind.
 *
 * Machines are AI CLIs already installed and signed in on a computer you control — DevFlow borrows
 * them. Cloud providers are your own API keys, billed to you. Both are personal: you only ever see
 * your own.
 */
export function RuntimesView() {
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showConnectMachine, setShowConnectMachine] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [companion, setCompanion] = useState<LocalCompanionInfo | null>(null);
  const [autoPairing, setAutoPairing] = useState(false);
  const autoPairAttempted = useRef(false);

  const { data, loading, error, refresh } = useAdminResource(loadRuntimes, {
    machines: [],
    providers: [],
  });

  // Poll rather than subscribe: liveness is derived from a heartbeat timestamp, so the page only
  // needs to re-read it periodically — there is no event to push when a laptop simply goes quiet.
  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  /**
   * Find the companion on this machine and, if it has never paired, pair it silently.
   *
   * This is the whole point of the loopback server: the user should not have to copy a code between
   * a browser and a terminal to see their own tools. The attempt is made once per mount and guarded
   * by a ref so the 15s refresh cannot retrigger it, and every failure is silent — if there is no
   * companion, the page simply looks the way it always did.
   */
  useEffect(() => {
    let active = true;

    void (async () => {
      const info = await probeLocalCompanion();
      if (!active) return;
      setCompanion(info);

      if (!info || info.paired || autoPairAttempted.current) return;
      autoPairAttempted.current = true;

      setAutoPairing(true);
      try {
        const pairing = await createDevFlowRuntimePairingCode();
        const paired = await pairLocalCompanion(pairing.code);
        if (!active) return;
        if (paired) {
          setCompanion({ ...info, paired: true, machineId: paired.machineId });
          await refresh();
        }
      } catch {
        // Falls back to the manual flow, which the modal still offers.
      } finally {
        if (active) setAutoPairing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  const handleAddProvider = useCallback(
    async (input: {
      provider: string;
      label: string;
      apiKey: string;
      baseUrl?: string;
      model?: string;
    }) => {
      await createDevFlowRuntimeProvider(input);
      setShowAddProvider(false);
      await refresh();
    },
    [refresh],
  );

  const handleDeleteProvider = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteDevFlowRuntimeProvider(id);
        await refresh();
      } finally {
        setDeletingId(null);
      }
    },
    [refresh],
  );

  const handleTestProvider = useCallback(async (id: string) => {
    setTestingId(id);
    try {
      const result = await testDevFlowRuntimeProvider(id);
      if (!result.ok) {
        throw new Error(result.error || "Test failed");
      }
    } finally {
      setTestingId(null);
    }
  }, []);

  const handleRevokeMachine = useCallback(
    async (id: string) => {
      setRevokingId(id);
      try {
        await revokeDevFlowRuntimeMachine(id);
        await refresh();
      } finally {
        setRevokingId(null);
      }
    },
    [refresh],
  );

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Runtimes</h1>
        <p style={{ color: "var(--text-2)", fontSize: 14, margin: 0 }}>
          The AI CLIs installed on your own machines, plus your personal cloud provider keys.
        </p>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Your Machines</h2>
          <Button variant="primary" onClick={() => setShowConnectMachine(true)}>
            Connect a machine
          </Button>
        </div>

        {autoPairing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              padding: "10px 12px",
              marginBottom: 12,
              borderRadius: 8,
              background: "var(--bg-2, rgba(255,255,255,0.04))",
            }}
          >
            <span style={{ color: "var(--text-2)" }}>
              Found a companion on this machine — pairing it now…
            </span>
          </div>
        )}

        <RuntimesMachinesSection
          machines={data.machines}
          loading={loading}
          error={error}
          onConnect={() => setShowConnectMachine(true)}
          onRevoke={handleRevokeMachine}
          revokingId={revokingId}
          thisMachineId={companion?.machineId ?? null}
        />
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Your Cloud Providers</h2>
          <Button variant="primary" onClick={() => setShowAddProvider(true)}>
            Add Provider
          </Button>
        </div>
        <RuntimesProvidersSection
          providers={data.providers}
          loading={loading}
          error={error}
          onDelete={handleDeleteProvider}
          onTest={handleTestProvider}
          testingId={testingId}
          deletingId={deletingId}
        />
      </div>

      {showConnectMachine && (
        <ConnectMachineModal onClose={() => setShowConnectMachine(false)} />
      )}

      {showAddProvider && (
        <AddProviderModal
          onClose={() => setShowAddProvider(false)}
          onAdd={handleAddProvider}
        />
      )}
    </div>
  );
}
