// @ts-nocheck
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/shared/components/ui";
import { useAuth } from "@/shared/auth/auth-provider";
import {
  IconActivity,
  IconBell,
  IconCalendar,
  IconChevronDown,
  IconCloud,
  IconCpu,
  IconCreditCard,
  IconDatabase,
  IconFileText,
  IconFolder,
  IconGitHub,
  IconHome,
  IconLifeBuoy,
  IconLogout,
  IconRocket,
  IconSearch,
  IconSettings,
  IconShield,
  IconUser,
  IconUsers,
} from "@/shared/components/icons";

const ADMIN_NAV = [
  { id: "overview", label: "Overview", icon: <IconHome size={17} /> },
  { id: "orchestration", label: "AI Orchestration", icon: <IconCpu size={17} />, badge: "Live" },
  { id: "cost", label: "Cost & Billing", icon: <IconCreditCard size={17} /> },
  { id: "providers", label: "AI Providers", icon: <IconDatabase size={17} /> },
  { id: "users", label: "User Management", icon: <IconUsers size={17} /> },
  { id: "domains", label: "Domains", icon: <IconCloud size={17} />, badge: "Plan" },
  { id: "repositories", label: "Repositories", icon: <IconGitHub size={17} /> },
  { id: "handoffs", label: "Handoffs", icon: <IconRocket size={17} /> },
  { id: "projects", label: "Projects", icon: <IconFolder size={17} /> },
  { id: "audit", label: "Audit Log", icon: <IconFileText size={17} /> },
  { id: "health", label: "System Health", icon: <IconActivity size={17} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

const TITLES = {
  overview: "Overview",
  orchestration: "AI Orchestration",
  cost: "Cost & Billing",
  providers: "AI Providers",
  users: "User Management",
  domains: "Domains",
  repositories: "Repositories",
  handoffs: "Delivery Handoffs",
  projects: "Projects",
  audit: "Audit Log",
  health: "System Health",
  settings: "Settings",
};

export function AdminConsoleShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { devFlowUser, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const route = pathname.replace(/^\/admin\/?/, "") || "overview";
  const base = route.split("/")[0] || "overview";
  const adminName = devFlowUser?.fullName || user?.email?.split("@")[0] || "Platform Admin";
  const adminEmail = devFlowUser?.email || user?.email || "No email";
  const adminInitials = initialsFor(adminName || adminEmail);

  const navigate = async (target: string) => {
    if (target === "__signout") {
      await signOut();
      // Console sign-out returns to the internal entry point, not the client app.
      router.push("/sign-in");
    } else router.push(`/admin/${target}`);
  };

  return (
    <div className="cs-shell">
      <AdminSidebar route={base} onNavigate={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} adminName={adminName} adminEmail={adminEmail} adminInitials={adminInitials} />
      <div className="cs-content">
        <AdminTopBar title={TITLES[base] || "Overview"} onMenu={() => setMobileOpen((open) => !open)} onNavigate={navigate} adminName={adminName} adminEmail={adminEmail} adminInitials={adminInitials} />
        <main className="cs-page">{children}</main>
      </div>
    </div>
  );
}

function AdminSidebar({ route, onNavigate, mobileOpen, setMobileOpen, adminName, adminEmail, adminInitials }) {
  return (
    <aside className={"cs-sidebar" + (mobileOpen ? " is-mobile-open" : "")}>
      <div className="cs-sidebar-inner">
        <div className="cs-brand"><Logo /></div>
        <div className="pm-org">
          <div className="pm-org-label">Persona</div>
          <div className="pm-org-name">Platform Admin</div>
          <div className="pm-org-meta">Alphaexplora - Control Plane</div>
        </div>
        <div className="cs-nav-scroll">
          <nav className="cs-nav">
            {ADMIN_NAV.map((item) => (
              <a key={item.id} className={"cs-nav-item" + (route === item.id ? " active" : "")} onClick={() => { onNavigate(item.id); setMobileOpen?.(false); }}>
                <span className="cs-nav-icon">{item.icon}</span>
                <span className="cs-nav-label">{item.label}</span>
                {item.badge && <span className="dev-live-pill"><span className="dot" />{item.badge}</span>}
              </a>
            ))}
          </nav>
        </div>
        <div className="cs-spacer" />
        <a className="cs-support"><IconLifeBuoy size={15} /> Help &amp; Support</a>
        <div className="cs-user">
          <span style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 600, fontSize: 13, flexShrink: 0, position: "relative", border: "1px solid rgba(255,255,255,.08)" }}>{adminInitials}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminName}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminEmail}</div>
          </div>
          <span className="pm-pill">Admin</span>
        </div>
      </div>
    </aside>
  );
}

function AdminTopBar({ title, onMenu, onNavigate, adminName, adminEmail, adminInitials }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const click = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  return (
    <header className="cs-topbar">
      <div className="cs-topbar-inner">
        <button className="cs-mobile-menu" onClick={onMenu} aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
        <div className="cs-crumbs"><span className="cs-crumb-root">Admin</span><span className="cs-crumb-sep">/</span><span className="cs-crumb-current">{title}</span></div>
        <div style={{ flex: 1, maxWidth: 430, marginLeft: 24 }}>
          <div style={{ position: "relative" }}>
            <IconSearch size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input className="input" placeholder="Search users, projects, providers, audit events..." style={{ paddingLeft: 36, height: 36, fontSize: 13.5 }} />
          </div>
        </div>
        <button className="cs-iconbtn" aria-label="Notifications"><IconBell size={17} /><span className="cs-iconbtn-badge">5</span></button>
        <div ref={ref} className="cs-avatar-wrap">
          <button className="cs-avatar-trigger" onClick={() => setOpen((value) => !value)}><span style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 600, fontSize: 12 }}>{adminInitials}</span><IconChevronDown size={14} style={{ color: "var(--text-3)" }} /></button>
          {open && <div className="cs-menu"><div className="cs-menu-header"><div style={{ fontWeight: 600, fontSize: 14 }}>{adminName}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{adminEmail}</div></div><button className="cs-menu-item" onClick={() => { setOpen(false); onNavigate("settings"); }}><IconUser size={15} /> Profile &amp; settings</button><button className="cs-menu-item"><IconShield size={15} /> Security</button><div className="cs-menu-sep" /><button className="cs-menu-item cs-menu-item--danger" onClick={() => onNavigate("__signout")}><IconLogout size={15} /> Sign out</button></div>}
        </div>
      </div>
    </header>
  );
}

function initialsFor(label) {
  return String(label || "Admin")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}
