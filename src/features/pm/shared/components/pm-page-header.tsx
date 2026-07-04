import type { ReactNode } from "react";

export function PMPageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 6, margin: "6px 0 0" }}>{subtitle}</p>}
        </div>
        {actions && <div className="row gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
