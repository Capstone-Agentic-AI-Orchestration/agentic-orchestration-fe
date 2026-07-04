// @ts-nocheck
"use client";

import type { ReactNode } from "react";

export function DevPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text-3)", fontSize: 13.5, marginTop: 6 }}>{subtitle}</p>}
      </div>
      {actions && <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

