import type { ReactNode } from "react";

export function ClientPageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: "var(--text-2)", fontSize: 14, margin: "6px 0 0", lineHeight: 1.55 }}>{subtitle}</p>}
        </div>
        {actions && <div className="row gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
