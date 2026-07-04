"use client";

import React, {
  cloneElement,
  isValidElement,
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  IconAlertTriangle,
  IconBell,
  IconCheckCircle,
  IconClose,
  IconInfo,
  IconSearch,
} from "@/shared/components/icons";

/* ---------------- Logo ---------------- */
export function Logo({ size = 28 }: { size?: number }) {
  const markSize = size + 18;
  return (
    <div className="alpha-logo" style={{ ["--logo-mark-size" as string]: `${markSize}px` } as CSSProperties}>
      <div className="alpha-logo-mark" aria-hidden="true">
        <svg width={markSize} height={markSize} viewBox="0 0 96 96" fill="none">
          <path d="M16 57C11 40 17 22 33 12" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M63 12C79 20 87 38 80 56" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M22 78L48 16L74 78L48 66L22 78Z" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M38 55L48 31L58 55L48 50L38 55Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M25 88L34 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M12 88L24 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M39 82C47 85 57 85 65 81" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="alpha-logo-wordmark">ALPHAEXPLORA</div>
    </div>
  );
}

/* ---------------- Button ---------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  title?: string;
}

const withIconClass = (icon: ReactElement<{ className?: string }>) =>
  cloneElement(icon, { className: ["icon", icon.props.className].filter(Boolean).join(" ") });

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  type = "button",
  style,
  className = "",
  disabled,
  title,
}: ButtonProps) {
  const cls = ["btn", `btn-${variant}`, size !== "md" && `btn-${size}`, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style} title={title}>
      {isValidElement(icon) ? withIconClass(icon as ReactElement<{ className?: string }>) : null}
      {children}
      {isValidElement(iconRight) ? withIconClass(iconRight as ReactElement<{ className?: string }>) : null}
    </button>
  );
}

/* ---------------- Field / Input / Textarea / Select ---------------- */
export function Field({
  label,
  helper,
  error,
  children,
}: {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={"field" + (error ? " has-error" : "")}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {error ? <span className="field-error">{error}</span> : helper ? <span className="field-helper">{helper}</span> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["input", props.className].filter(Boolean).join(" ")} {...props} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["textarea", props.className].filter(Boolean).join(" ")} {...props} />;
}
export function Select({ children, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={["select", "input", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </select>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  glass = false,
  hover = false,
  className = "",
  style,
  children,
  ...rest
}: {
  glass?: boolean;
  hover?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const cls = [glass ? "card-glass" : "card", hover && "card-hover", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={style} {...rest}>
      {children}
    </div>
  );
}

/* ---------------- Badge ---------------- */
type BadgeTone = "neutral" | "gray" | "blue" | "purple" | "green" | "amber" | "attention" | "red";
export function Badge({
  tone = "neutral",
  dot = false,
  children,
  style,
}: {
  // Accept the known tones plus arbitrary status strings coming from the backend.
  tone?: BadgeTone | (string & {});
  dot?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const toneClass = tone === "neutral" ? "badge-gray" : `badge-${tone}`;
  return (
    <span className={`badge ${toneClass}`} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({
  initials = "AE",
  online,
  size = 36,
  color,
}: {
  initials?: string;
  online?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: color }}>
      {initials}
      {online && <span className="online" />}
    </span>
  );
}

/* ---------------- Tabs ---------------- */
export interface TabItem {
  label: ReactNode;
  value: string;
}
export function Tabs({ items, value, onChange }: { items: TabItem[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={"tab" + (value === t.value ? " active" : "")}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Modal (portal + escape + scroll lock) ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.72)",
        display: "grid",
        placeItems: "center",
        padding: 24,
        animation: "modalFade .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width, maxWidth: "92vw", animation: "modalIn .2s ease" }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close" style={{ padding: 6, height: 30 }}>
            <IconClose size={16} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "16px 22px",
              borderTop: "1px solid var(--border-soft)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Toast (inline) ---------------- */
export function Toast({ tone = "green", title, message }: { tone?: "green" | "blue" | "amber" | "red"; title: ReactNode; message?: ReactNode }) {
  const tones = {
    green: { Icon: IconCheckCircle, color: "#6EE7B7" },
    blue: { Icon: IconInfo, color: "var(--text)" },
    amber: { Icon: IconAlertTriangle, color: "#FBBF24" },
    red: { Icon: IconAlertTriangle, color: "#FCA5A5" },
  } as const;
  const T = tones[tone] ?? tones.green;
  return (
    <div className="toast">
      <T.Icon size={20} style={{ color: T.color }} className="toast-icon" />
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {message && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{message}</div>}
      </div>
    </div>
  );
}

/* ---------------- Sidebar nav item ---------------- */
export function SideNavItem({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon?: ReactNode;
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  badge?: ReactNode;
}) {
  return (
    <div className={"snav" + (active ? " active" : "")} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {badge && <span style={{ marginLeft: "auto" }}>{badge}</span>}
    </div>
  );
}

/* ---------------- Top app bar (product chrome) ---------------- */
export function TopBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--bg-1)",
      }}
    >
      <div className="row gap-2" style={{ flex: 1, maxWidth: 480 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <IconSearch
            size={15}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}
          />
          <input className="input" placeholder="Search projects, clients, deliveries…" style={{ paddingLeft: 36, height: 36 }} />
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ padding: 8, height: 36, position: "relative" }} aria-label="Notifications">
        <IconBell size={17} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--attention)",
            boxShadow: "0 0 0 2px var(--bg-1)",
          }}
        />
      </button>
      <Avatar initials="JM" online size={32} />
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      {icon && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--r-lg)",
            background: "var(--bg-3)",
            border: "1px solid var(--border-soft)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            color: "var(--text-2)",
          }}
        >
          {icon}
        </div>
      )}
      <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h4>
      {description && (
        <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.55 }}>{description}</p>
      )}
      {action}
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ w = "100%", h = 14, r = 4, style }: { w?: number | string; h?: number | string; r?: number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/* ---------------- Layout primitives ---------------- */
type SpaceScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
const px = (n: SpaceScale) => `${n * 4}px`;

export function Stack({
  gap = 4,
  align,
  style,
  className,
  children,
}: {
  gap?: SpaceScale;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: px(gap), alignItems: align, ...style }}>
      {children}
    </div>
  );
}

export function Row({
  gap = 3,
  align = "center",
  justify,
  wrap,
  style,
  className,
  children,
}: {
  gap?: SpaceScale;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: align, justifyContent: justify, gap: px(gap), flexWrap: wrap ? "wrap" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

export function Grid({
  cols,
  min,
  gap = 4,
  style,
  className,
  children,
}: {
  cols?: number;
  min?: number;
  gap?: SpaceScale;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  const templateColumns = min
    ? `repeat(auto-fit, minmax(${min}px, 1fr))`
    : cols
      ? `repeat(${cols}, minmax(0, 1fr))`
      : undefined;
  return (
    <div className={className} style={{ display: "grid", gridTemplateColumns: templateColumns, gap: px(gap), ...style }}>
      {children}
    </div>
  );
}

/* ---------------- Text ---------------- */
type TextTone = "primary" | "secondary" | "tertiary" | "muted";
const toneColor: Record<TextTone, string> = {
  primary: "var(--text)",
  secondary: "var(--text-2)",
  tertiary: "var(--text-3)",
  muted: "var(--text-4)",
};
export function Text({
  as: Tag = "span",
  size = 14,
  weight = 400,
  tone = "primary",
  mono = false,
  style,
  className,
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  size?: number;
  weight?: number;
  tone?: TextTone;
  mono?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag
      className={[mono ? "mono" : undefined, className].filter(Boolean).join(" ") || undefined}
      style={{ fontSize: size, fontWeight: weight, color: toneColor[tone], margin: 0, ...style }}
    >
      {children}
    </Tag>
  );
}

/* ---------------- Divider ---------------- */
export function Divider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: "var(--border-soft)", width: "100%", ...style }} />;
}

/* ---------------- Stat ---------------- */
export function Stat({
  label,
  value,
  delta,
  deltaTone = "secondary",
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: "secondary" | "success" | "danger";
}) {
  const dColor = deltaTone === "success" ? "#6EE7B7" : deltaTone === "danger" ? "#FCA5A5" : "var(--text-3)";
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
      {delta != null && <div style={{ fontSize: 12, color: dColor, marginTop: 4 }}>{delta}</div>}
    </div>
  );
}
