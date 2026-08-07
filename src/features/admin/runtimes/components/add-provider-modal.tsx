"use client";

import { useState } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

interface AddProviderModalProps {
  onClose: () => void;
  onAdd: (input: {
    provider: string;
    label: string;
    apiKey: string;
    baseUrl?: string;
    model?: string;
  }) => Promise<void>;
}

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "opencode", label: "OpenCode" },
  { value: "gemini", label: "Gemini" },
  { value: "ollama", label: "Ollama (local)" },
];

export function AddProviderModal({ onClose, onAdd }: AddProviderModalProps) {
  const [provider, setProvider] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocal = provider === "ollama";

  const handleSubmit = async () => {
    setError(null);

    if (!provider || !label || (!isLocal && !apiKey)) {
      setError("Provider, label, and API key are required");
      return;
    }

    setBusy(true);
    try {
      await onAdd({
        provider,
        label,
        apiKey: isLocal ? "" : apiKey,
        baseUrl: baseUrl || undefined,
        model: model || undefined,
      });
    } catch (err) {
      setError(compactDevFlowError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Add Cloud Provider"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy || !provider || !label}>
            {busy ? "Adding..." : "Add Provider"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Provider
          </label>
          <Select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setError(null);
            }}
          >
            <option value="">Select a provider…</option>
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Label
          </label>
          <Input
            placeholder="e.g., Production OpenAI"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {!isLocal && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              API Key
            </label>
            <Input
              type="password"
              placeholder="Your API key (stored securely)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        )}

        {isLocal && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Base URL
            </label>
            <Input
              placeholder="e.g., http://localhost:11434"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Model (optional)
          </label>
          <Input
            placeholder="e.g., gpt-4, claude-3-opus-20240229"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        {!isLocal && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Base URL (optional)
            </label>
            <Input
              placeholder="Custom endpoint URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div style={{ color: "var(--text-error)", fontSize: 12, padding: 8, backgroundColor: "var(--bg-error)", borderRadius: 6 }}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
