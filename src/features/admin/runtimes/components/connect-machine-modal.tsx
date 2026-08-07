"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@/shared/components/ui";
import {
  createDevFlowRuntimePairingCode,
  type DevFlowPairingCode,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

interface ConnectMachineModalProps {
  onClose: () => void;
}

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access is unavailable over plain HTTP on some hosts. The text stays selectable,
      // so a failure costs the convenience and nothing else.
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
      <code
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          padding: "8px 10px",
          borderRadius: 6,
          background: "var(--bg-2, rgba(255,255,255,0.04))",
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {command}
      </code>
      <Button variant="ghost" onClick={copy} style={{ fontSize: 12, flexShrink: 0 }}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/**
 * How a machine gets connected.
 *
 * Download-first, because the setup script is the only path that asks nothing of the user: it finds
 * Node, installs the companion, and enables autostart, after which this page discovers and pairs the
 * machine over loopback with nothing typed.
 *
 * The manual sections stay because the automatic path cannot always work — Safari blocks loopback
 * requests from HTTPS pages, the discovery port can be occupied, and the machine being connected may
 * not be the one running this browser. They are collapsed so they do not compete with the easy route.
 */
export function ConnectMachineModal({ onClose }: ConnectMachineModalProps) {
  const [showManual, setShowManual] = useState(false);
  const [pairing, setPairing] = useState<DevFlowPairingCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only mint a code if the user opens the manual section. Codes are single-use and short-lived, so
  // issuing one for every visitor who never needs it is pure waste.
  const issueCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPairing(await createDevFlowRuntimePairingCode());
    } catch (err) {
      setError(compactDevFlowError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showManual && !pairing && !loading) void issueCode();
  }, [showManual, pairing, loading, issueCode]);

  return (
    <Modal
      open
      title="Connect a machine"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div style={{ display: "grid", gap: 18, marginBottom: 8 }}>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
          DevFlow finds your AI CLIs by running a small companion on the machine itself — so what you
          see is what is installed on <strong>that computer</strong>, not on the server.
        </p>

        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            borderRadius: 10,
            background: "var(--bg-2, rgba(255,255,255,0.04))",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>Set up this computer</div>
          <div>
            <a
              href={`${API_URL}/api/v2/runtime-companion/install.cmd`}
              download="devflow-companion-setup.cmd"
              className="btn btn-primary"
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              Download companion setup
            </a>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
            Save it into your DevFlow folder and double-click it. It installs the companion and keeps
            it running at login. This page will then pick up the machine on its own — nothing to copy
            or paste.
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)" }}>
            Windows. Requires Node 20+. On macOS or Linux, use the commands below.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowManual((open) => !open)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-2)",
            textDecoration: "underline",
          }}
        >
          {showManual ? "Hide manual setup" : "Prefer a terminal, or connecting a different machine?"}
        </button>

        {showManual && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                1. Install the companion
              </div>
              <CommandBlock command="cd agentic-orchestration-runtime && npm install && npm run install:global" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                2. Keep it running
              </div>
              <CommandBlock command={`devflow-runtime service install --server ${API_URL}`} />
              <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 4 }}>
                On this computer, that is all — the page pairs it automatically. Use{" "}
                <code>devflow-runtime daemon</code> instead to run it once in the foreground.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                3. Only for a different machine: pair it with a code
              </div>
              {error && (
                <div
                  style={{
                    color: "var(--text-error)",
                    fontSize: 12,
                    padding: 8,
                    marginBottom: 8,
                    backgroundColor: "var(--bg-error)",
                    borderRadius: 6,
                  }}
                >
                  {error}
                </div>
              )}
              {pairing ? (
                <>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "monospace",
                      letterSpacing: 3,
                      marginBottom: 4,
                    }}
                  >
                    {pairing.code}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>
                    Expires {new Date(pairing.expiresAt).toLocaleTimeString()} · single use
                  </div>
                  <CommandBlock
                    command={`devflow-runtime register --server ${API_URL} --code ${pairing.code}`}
                  />
                </>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {loading ? "Generating a code…" : "No code generated."}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "var(--text-2)",
                paddingTop: 8,
                borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                lineHeight: 1.5,
              }}
            >
              Optional, and only needed once DevFlow can dispatch work to your machine:{" "}
              <code>devflow-runtime resource add --name &quot;My project&quot; --path .</code> — this
              exposes a project directory. Only its name and a fingerprint reach DevFlow, never the
              path.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
