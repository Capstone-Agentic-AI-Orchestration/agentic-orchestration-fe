"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/shared/components/ui";
import { useAuth } from "@/shared/auth/auth-provider";
import { IconChevronDown, IconLifeBuoy, IconLogout, IconSearch, IconShield, IconUser } from "@/shared/components/icons";

export interface ShellNavItem {
  id: string;
  label: ReactNode;
  icon: ReactNode;
  /** "Live"-style string pill, or a numeric count badge. */
  badge?: string | number;
  /** Extra `base` segments that should mark this item active (e.g. projects ← project, orchestrate). */
  aliases?: string[];
}

export interface AppShellProps {
  /** Crumb root + URL prefix, e.g. "PM" and "/pm". */
  rootLabel: string;
  basePath: string;
  rolePill: string;
  nav: ShellNavItem[];
  titles: Record<string, string>;
  defaultRoute: string;
  searchPlaceholder: string;
  showSearch?: boolean;
  showSearchHint?: boolean;
  showOnlineDot?: boolean;
  showSupport?: boolean;
  showSecurity?: boolean;
  /** Persona block content (default). Ignored when `sidebarHeader` is provided. */
  personaName?: string;
  personaMeta?: string;
  /** Replaces the persona block entirely (e.g. the client engagement panel). */
  sidebarHeader?: ReactNode;
  /** Topbar controls between search and the avatar (project switcher, notification bell, …). */
  rightSlot?: ReactNode;
  /** Desktop icon rail that expands over the page on hover or keyboard focus. */
  hoverExpandSidebar?: boolean;
  /** Places the product logo and wordmark at the start of the full-width topbar. */
  brandInTopbar?: boolean;
  /** Applies role-specific surface styling without changing other consoles. */
  shellVariant?: "pm";
  children: ReactNode;
}

interface ShellProfile {
  name: string;
  email: string;
  initials: string;
}

function deriveProfile(user: { fullName?: string | null; email?: string | null } | null | undefined, fallback: string): ShellProfile {
  const name = user?.fullName || user?.email?.split("@")[0] || fallback;
  const initials =
    name
      .split(/[\s.@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || fallback.slice(0, 2).toUpperCase();
  return { name, email: user?.email || "No email", initials };
}

function Avatar({ initials, size = 38, online }: { initials: string; size?: number; online?: boolean }) {
  return (
    <span
      className="mono"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--bg-3)",
        border: "1px solid var(--border)",
        display: "grid",
        placeItems: "center",
        color: "var(--text-2)",
        fontWeight: 500,
        fontSize: size * 0.34,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {initials}
      {online && (
        <span
          style={{ position: "absolute", right: -1, bottom: -1, width: 9, height: 9, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--bg-0)" }}
        />
      )}
    </span>
  );
}

export function AppShell({
  rootLabel,
  basePath,
  rolePill,
  nav,
  titles,
  defaultRoute,
  searchPlaceholder,
  showSearch = true,
  showSearchHint,
  showOnlineDot,
  showSupport = true,
  showSecurity = true,
  personaName,
  personaMeta,
  sidebarHeader,
  rightSlot,
  hoverExpandSidebar = false,
  brandInTopbar = false,
  shellVariant,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { devFlowUser, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const prefix = new RegExp(`^${basePath}/?`);
  const route = pathname.replace(prefix, "") || defaultRoute;
  const base = route.split("/")[0] || defaultRoute;
  const profile = deriveProfile(devFlowUser, rolePill);

  const navigate = async (target: string) => {
    if (target === "__signout") {
      await signOut();
      // Console sign-out returns to the internal entry point. The client
      // sign-in lives in the separate Alphaexplora client app.
      router.push("/sign-in");
      return;
    }
    router.push(`${basePath}/${target}`);
  };

  const isActive = (item: ShellNavItem) => base === item.id || (item.aliases?.includes(base) ?? false);

  const shellClassName = [
    "cs-shell",
    hoverExpandSidebar && "cs-shell--hover-sidebar",
    brandInTopbar && "cs-shell--topbar-brand",
    shellVariant && `cs-shell--${shellVariant}`,
  ].filter(Boolean).join(" ");

  const currentCrumbTarget = nav.find(isActive)?.id || defaultRoute;

  return (
    <div className={shellClassName}>
      <aside className={"cs-sidebar" + (mobileOpen ? " is-mobile-open" : "")}>
        <div className="cs-sidebar-inner">
          {!brandInTopbar && (
            <div className="cs-brand">
              <Logo />
            </div>
          )}

          {sidebarHeader ?? (
            <div className="pm-org">
              <div className="pm-org-label">Persona</div>
              <div className="pm-org-name">{personaName}</div>
              {personaMeta && <div className="pm-org-meta">{personaMeta}</div>}
            </div>
          )}

          <div className="cs-nav-scroll">
            <nav className="cs-nav">
              {nav.map((item) => (
                <a
                  key={item.id}
                  className={"cs-nav-item" + (isActive(item) ? " active" : "")}
                  onClick={() => {
                    navigate(item.id);
                    setMobileOpen(false);
                  }}
                >
                  <span className="cs-nav-icon">{item.icon}</span>
                  <span className="cs-nav-label">{item.label}</span>
                  {item.badge !== undefined &&
                    (typeof item.badge === "number" ? (
                      <span className="cs-nav-badge cs-nav-badge--count">{item.badge}</span>
                    ) : (
                      <span className="dev-live-pill">
                        <span className="dot" />
                        {item.badge}
                      </span>
                    ))}
                </a>
              ))}
            </nav>
          </div>

          <div className="cs-spacer" />
          {showSupport && (
            <a className="cs-support">
              <IconLifeBuoy size={15} /> <span className="cs-support-label">Help &amp; Support</span>
            </a>
          )}

          <div className="cs-user">
            <Avatar initials={profile.initials} online={showOnlineDot} />
            <div className="cs-user-details" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.email}</div>
            </div>
            <span className="pm-pill">{rolePill}</span>
          </div>
        </div>
      </aside>

      <div className="cs-content">
        <AppTopBar
          rootLabel={rootLabel}
          title={titles[base] || titles[defaultRoute] || rootLabel}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          showSearchHint={showSearchHint}
          showSecurity={showSecurity}
          showBrand={brandInTopbar}
          rightSlot={rightSlot}
          profile={profile}
          onMenu={() => setMobileOpen((open) => !open)}
          onNavigate={navigate}
          rootTarget={defaultRoute}
          currentTarget={currentCrumbTarget}
        />
        <main className="cs-page">{children}</main>
      </div>
    </div>
  );
}

function AppTopBar({
  rootLabel,
  title,
  searchPlaceholder,
  showSearch,
  showSearchHint,
  showSecurity,
  showBrand,
  rightSlot,
  profile,
  onMenu,
  onNavigate,
  rootTarget,
  currentTarget,
}: {
  rootLabel: string;
  title: string;
  searchPlaceholder: string;
  showSearch: boolean;
  showSearchHint?: boolean;
  showSecurity: boolean;
  showBrand: boolean;
  rightSlot?: ReactNode;
  profile: ShellProfile;
  onMenu: () => void;
  onNavigate: (target: string) => void;
  rootTarget: string;
  currentTarget: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  return (
    <header className="cs-topbar">
      <div className="cs-topbar-inner">
        {showBrand && (
          <div className="cs-topbar-brand">
            <Logo size={18} />
          </div>
        )}

        <button className="cs-mobile-menu" onClick={onMenu} aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <div className="cs-crumbs">
          <button type="button" className="cs-crumb-link cs-crumb-root" onClick={() => onNavigate(rootTarget)}>
            {rootLabel}
          </button>
          <span className="cs-crumb-sep">/</span>
          <button type="button" className="cs-crumb-link cs-crumb-current" onClick={() => onNavigate(currentTarget)}>
            {title}
          </button>
        </div>

        {showSearch && (
          <div className="cs-topbar-search">
            <div style={{ position: "relative" }}>
              <IconSearch size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
              <input className="input" placeholder={searchPlaceholder} style={{ paddingLeft: 36, height: 36, fontSize: 13.5 }} />
              {showSearchHint && (
                <span
                  className="mono"
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--text-3)", padding: "2px 6px", borderRadius: 4, background: "var(--bg-sunken)", border: "1px solid var(--border)" }}
                >
                  Ctrl K
                </span>
              )}
            </div>
          </div>
        )}

        <div className="cs-topbar-actions">
          {rightSlot}

          <div ref={ref} className="cs-avatar-wrap">
            <button className="cs-avatar-trigger" onClick={() => setOpen((value) => !value)}>
              <Avatar initials={profile.initials} size={32} />
              <IconChevronDown size={14} style={{ color: "var(--text-3)" }} />
            </button>
            {open && (
              <div className="cs-menu">
                <div className="cs-menu-header">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{profile.email}</div>
                </div>
                <button
                  className="cs-menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("settings");
                  }}
                >
                  <IconUser size={15} /> Profile &amp; preferences
                </button>
                {showSecurity && (
                  <button className="cs-menu-item">
                    <IconShield size={15} /> Security
                  </button>
                )}
                <div className="cs-menu-sep" />
                <button className="cs-menu-item cs-menu-item--danger" onClick={() => onNavigate("__signout")}>
                  <IconLogout size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
