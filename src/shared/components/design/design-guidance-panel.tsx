"use client";

import { useState, type CSSProperties } from "react";
import type { DevFlowDesignGuidance, DevFlowDesignSystem } from "@/shared/api/devflow-api";
import {
  DEFAULT_FORBIDDEN_DESIGN_PATTERNS,
  DESIGN_PRESET_PREVIEWS,
  DESIGN_SYSTEM_PRESETS,
  describeDesignGuidance,
  designSystemPresetById,
  normalizeDesignGuidance,
  renderDesignMarkdown,
} from "@/shared/design-guidance";
import { Button, Field, Select, Tabs, Textarea } from "@/shared/components/ui";
import { IconCheck } from "@/shared/components/icons";

interface DesignGuidancePanelProps {
  value: DevFlowDesignGuidance;
  onChange?: (value: DevFlowDesignGuidance) => void;
  readOnly?: boolean;
  compact?: boolean;
}

type EditableDesignSection = Exclude<keyof DevFlowDesignSystem, "presetId" | "antiPatterns">;

const selectStyle = { minWidth: 0 };

const panelDisclosureStyle: CSSProperties = {
  border: "1px solid var(--border-soft)",
  borderRadius: 8,
  background: "rgba(255,255,255,.025)",
  padding: "10px 12px",
};

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  color: "var(--text-2)",
  fontSize: "0.8125rem",
  fontWeight: 700,
};

const DESIGN_SECTIONS: Array<{ key: EditableDesignSection; label: string; rows: number }> = [
  { key: "palette", label: "Color", rows: 3 },
  { key: "typography", label: "Typography", rows: 3 },
  { key: "spacing", label: "Spacing", rows: 3 },
  { key: "layout", label: "Layout", rows: 4 },
  { key: "components", label: "Components", rows: 4 },
  { key: "motion", label: "Motion", rows: 3 },
  { key: "voice", label: "Voice", rows: 3 },
  { key: "brand", label: "Brand", rows: 3 },
];

export function DesignGuidancePanel({
  value,
  onChange,
  readOnly = false,
  compact = false,
}: DesignGuidancePanelProps) {
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const guidance = normalizeDesignGuidance(value);
  const designSystem = guidance.designSystem ?? DESIGN_SYSTEM_PRESETS[0];

  const update = (patch: Partial<DevFlowDesignGuidance>) => {
    onChange?.(normalizeDesignGuidance({ ...guidance, ...patch }));
  };

  const updateDesignSystem = (patch: Partial<DevFlowDesignSystem>) => {
    update({ designSystem: { ...designSystem, ...patch } });
  };

  const togglePattern = (pattern: string) => {
    const exists = guidance.forbiddenPatterns.includes(pattern);
    update({
      forbiddenPatterns: exists
        ? guidance.forbiddenPatterns.filter((item) => item !== pattern)
        : [...guidance.forbiddenPatterns, pattern],
    });
  };

  if (readOnly) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 700 }}>
          {describeDesignGuidance(guidance)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[...new Set([...guidance.forbiddenPatterns, ...designSystem.antiPatterns])].map((pattern) => (
            <span key={pattern} className="auto-analyze-feature-chip">
              Avoid {pattern}
            </span>
          ))}
        </div>
        {guidance.notes && (
          <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--text-2)" }}>
            {guidance.notes}
          </p>
        )}
        <pre
          style={{
            margin: 0,
            maxHeight: 240,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            border: "1px solid var(--border-soft)",
            borderRadius: 8,
            background: "rgba(0,0,0,.28)",
            padding: 12,
            color: "var(--text-2)",
            fontSize: "0.75rem",
            lineHeight: 1.5,
          }}
        >
          {renderDesignMarkdown(guidance)}
        </pre>
      </div>
    );
  }

  if (compact) {
    return (
      <CompactDesignControls
        guidance={guidance}
        designSystem={designSystem}
        onUpdate={update}
        onUpdateDesignSystem={updateDesignSystem}
        onTogglePattern={togglePattern}
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Tabs
        value={mode}
        onChange={(next) => setMode(next as "quick" | "advanced")}
        items={[
          { label: "Quick", value: "quick" },
          { label: "Advanced", value: "advanced" },
        ]}
      />

      {mode === "quick" ? (
        <QuickDesignControls
          guidance={guidance}
          onUpdate={update}
          onTogglePattern={togglePattern}
        />
      ) : (
        <AdvancedDesignControls
          guidance={guidance}
          designSystem={designSystem}
          onUpdateDesignSystem={updateDesignSystem}
        />
      )}
    </div>
  );
}

function CompactDesignControls({
  guidance,
  designSystem,
  onUpdate,
  onUpdateDesignSystem,
  onTogglePattern,
}: {
  guidance: DevFlowDesignGuidance;
  designSystem: DevFlowDesignSystem;
  onUpdate: (patch: Partial<DevFlowDesignGuidance>) => void;
  onUpdateDesignSystem: (patch: Partial<DevFlowDesignSystem>) => void;
  onTogglePattern: (pattern: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="design-preset-picker" aria-label="Design preset palette choices">
        {DESIGN_SYSTEM_PRESETS.map((preset) => {
          const preview = DESIGN_PRESET_PREVIEWS[preset.presetId];
          const colors = preview?.colors ?? ["#050505", "#1F2937", "#F8FAFC", "#60A5FA", "#34D399"];
          const selected = designSystem.presetId === preset.presetId;
          return (
            <button
              key={preset.presetId}
              type="button"
              className={`design-preset-card ${selected ? "selected" : ""}`}
              onClick={() => onUpdateDesignSystem(designSystemPresetById(preset.presetId))}
              aria-pressed={selected}
              style={{
                "--preset-bg": colors[0],
                "--preset-surface": colors[1],
                "--preset-text": colors[2],
                "--preset-accent": colors[3],
                "--preset-success": colors[4],
              } as CSSProperties}
            >
              <span className="design-preset-card-top">
                <span>
                  <span className="design-preset-name">{preview?.label ?? formatPresetName(preset.presetId)}</span>
                  <span className="design-preset-label">{preview?.paletteLabel ?? preset.palette}</span>
                </span>
                <span className="design-preset-check" aria-hidden="true">
                  {selected ? <IconCheck size={12} /> : null}
                </span>
              </span>
              <span className="design-preset-swatches">
                {colors.map((color) => (
                  <span key={`${preset.presetId}-${color}`} style={{ background: color }} />
                ))}
              </span>
              <span className="design-preset-sample" aria-hidden="true">
                <span className="design-preset-sample-sidebar" />
                <span className="design-preset-sample-main">
                  <span className="design-preset-sample-line strong" />
                  <span className="design-preset-sample-line" />
                  <span className="design-preset-sample-chip" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="design-quick-grid">
        <Field label="Theme">
          <Select
            value={guidance.theme}
            onChange={(event) => onUpdate({ theme: event.target.value as DevFlowDesignGuidance["theme"] })}
            style={selectStyle}
          >
            <option value="black">Black</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </Field>
        <Field label="Feel">
          <Select
            value={guidance.productFeel}
            onChange={(event) => onUpdate({ productFeel: event.target.value as DevFlowDesignGuidance["productFeel"] })}
            style={selectStyle}
          >
            <option value="operational">Operational</option>
            <option value="enterprise">Enterprise</option>
            <option value="playful">Playful</option>
            <option value="editorial">Editorial</option>
            <option value="luxury">Luxury</option>
          </Select>
        </Field>
        <Field label="Density">
          <Select
            value={guidance.layoutDensity}
            onChange={(event) => onUpdate({ layoutDensity: event.target.value as DevFlowDesignGuidance["layoutDensity"] })}
            style={selectStyle}
          >
            <option value="balanced">Balanced</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </Select>
        </Field>
        <Field label="Accessibility">
          <Select
            value={guidance.accessibilityLevel}
            onChange={(event) => onUpdate({ accessibilityLevel: event.target.value as DevFlowDesignGuidance["accessibilityLevel"] })}
            style={selectStyle}
          >
            <option value="strict">Strict</option>
            <option value="standard">Standard</option>
          </Select>
        </Field>
      </div>

      <Field label="Design notes">
        <Textarea
          rows={3}
          value={guidance.notes ?? ""}
          onChange={(event) => onUpdate({ notes: event.target.value })}
          placeholder="e.g. Dense project cockpit, black UI, clear approval gates, no decorative marketing sections"
        />
      </Field>

      <details style={panelDisclosureStyle}>
        <summary style={summaryStyle}>Forbidden patterns</summary>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {DEFAULT_FORBIDDEN_DESIGN_PATTERNS.map((pattern) => {
            const selected = guidance.forbiddenPatterns.includes(pattern);
            return (
              <button
                key={pattern}
                type="button"
                className={`auto-analyze-feature-chip ${selected ? "selected" : ""}`}
                onClick={() => onTogglePattern(pattern)}
                aria-pressed={selected}
                style={{
                  cursor: "pointer",
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  color: selected ? "var(--accent)" : undefined,
                }}
              >
                Avoid {pattern}
              </button>
            );
          })}
        </div>
      </details>

      <details style={panelDisclosureStyle}>
        <summary style={summaryStyle}>Edit full design contract</summary>
        <div style={{ marginTop: 12 }}>
          <AdvancedDesignControls
            guidance={guidance}
            designSystem={designSystem}
            onUpdateDesignSystem={onUpdateDesignSystem}
          />
        </div>
      </details>
    </div>
  );
}

function QuickDesignControls({
  guidance,
  onUpdate,
  onTogglePattern,
}: {
  guidance: DevFlowDesignGuidance;
  onUpdate: (patch: Partial<DevFlowDesignGuidance>) => void;
  onTogglePattern: (pattern: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <Field label="Theme">
          <Select
            value={guidance.theme}
            onChange={(event) => onUpdate({ theme: event.target.value as DevFlowDesignGuidance["theme"] })}
            style={selectStyle}
          >
            <option value="black">Black</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </Field>
        <Field label="Product feel">
          <Select
            value={guidance.productFeel}
            onChange={(event) => onUpdate({ productFeel: event.target.value as DevFlowDesignGuidance["productFeel"] })}
            style={selectStyle}
          >
            <option value="operational">Operational</option>
            <option value="enterprise">Enterprise</option>
            <option value="playful">Playful</option>
            <option value="editorial">Editorial</option>
            <option value="luxury">Luxury</option>
          </Select>
        </Field>
        <Field label="Layout density">
          <Select
            value={guidance.layoutDensity}
            onChange={(event) => onUpdate({ layoutDensity: event.target.value as DevFlowDesignGuidance["layoutDensity"] })}
            style={selectStyle}
          >
            <option value="balanced">Balanced</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </Select>
        </Field>
        <Field label="Accessibility">
          <Select
            value={guidance.accessibilityLevel}
            onChange={(event) => onUpdate({ accessibilityLevel: event.target.value as DevFlowDesignGuidance["accessibilityLevel"] })}
            style={selectStyle}
          >
            <option value="strict">Strict</option>
            <option value="standard">Standard</option>
          </Select>
        </Field>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DEFAULT_FORBIDDEN_DESIGN_PATTERNS.map((pattern) => {
          const selected = guidance.forbiddenPatterns.includes(pattern);
          return (
            <button
              key={pattern}
              type="button"
              className={`auto-analyze-feature-chip ${selected ? "selected" : ""}`}
              onClick={() => onTogglePattern(pattern)}
              aria-pressed={selected}
              style={{
                cursor: "pointer",
                borderColor: selected ? "var(--accent)" : "var(--border)",
                color: selected ? "var(--accent)" : undefined,
              }}
            >
              Avoid {pattern}
            </button>
          );
        })}
      </div>

      <Field label="Design notes">
        <Textarea
          rows={3}
          value={guidance.notes ?? ""}
          onChange={(event) => onUpdate({ notes: event.target.value })}
          placeholder="e.g. Dense project cockpit, black UI, clear approval gates, no decorative marketing sections"
        />
      </Field>
    </div>
  );
}

function AdvancedDesignControls({
  guidance,
  designSystem,
  onUpdateDesignSystem,
}: {
  guidance: DevFlowDesignGuidance;
  designSystem: DevFlowDesignSystem;
  onUpdateDesignSystem: (patch: Partial<DevFlowDesignSystem>) => void;
}) {
  const selectPreset = (presetId: string) => {
    onUpdateDesignSystem(designSystemPresetById(presetId));
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Field label="Design preset">
        <Select
          value={designSystem.presetId}
          onChange={(event) => selectPreset(event.target.value)}
          style={selectStyle}
        >
          {DESIGN_SYSTEM_PRESETS.map((preset) => (
            <option key={preset.presetId} value={preset.presetId}>
              {formatPresetName(preset.presetId)}
            </option>
          ))}
        </Select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {DESIGN_SECTIONS.map((section) => (
          <Field key={section.key} label={section.label}>
            <Textarea
              rows={section.rows}
              value={designSystem[section.key]}
              onChange={(event) => onUpdateDesignSystem({ [section.key]: event.target.value })}
            />
          </Field>
        ))}
      </div>

      <Field label="Anti-patterns">
        <Textarea
          rows={4}
          value={designSystem.antiPatterns.join("\n")}
          onChange={(event) =>
            onUpdateDesignSystem({
              antiPatterns: event.target.value
                .split("\n")
                .map((pattern) => pattern.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onUpdateDesignSystem(designSystemPresetById(designSystem.presetId))}
        >
          Reset preset
        </Button>
      </div>

      <pre
        aria-label="DESIGN.md preview"
        style={{
          margin: 0,
          maxHeight: 280,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          border: "1px solid var(--border-soft)",
          borderRadius: 8,
          background: "rgba(0,0,0,.28)",
          padding: 12,
          color: "var(--text-2)",
          fontSize: "0.75rem",
          lineHeight: 1.5,
        }}
      >
        {renderDesignMarkdown({ ...guidance, designSystem })}
      </pre>
    </div>
  );
}

function formatPresetName(presetId: string): string {
  return presetId
    .split("-")
    .map((part) => part.replace(/^\w/, (char) => char.toUpperCase()))
    .join(" ");
}
