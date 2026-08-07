"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/shared/components/ui";
import { useAuth } from "@/shared/auth/auth-provider";
import { IconChevronDown, IconChevronRight, IconClose, IconLifeBuoy, IconLogout, IconPlus, IconSearch, IconShield, IconUser } from "@/shared/components/icons";

/** Joins nav ids into one dependency string; a control character can never appear in an id. */
const TAB_ID_SEPARATOR = "\u001f";

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
  /**
   * Account-level controls rendered inside the avatar dropdown, above the profile links —
   * workspace switching, notifications, anything that belongs to the person rather than the page.
   */
  menuSlot?: ReactNode;
  /** Unread count surfaced on the avatar so a shut menu still signals there is something to see. */
  menuAlertCount?: number;
  /** Removes the desktop header while retaining a compact mobile navigation trigger. */
  showTopbar?: boolean;
  /** Makes the profile card at the bottom of the sidebar open the account menu. */
  accountMenuInSidebar?: boolean;
  /** Places the bare profile trigger before the navigation rather than at the bottom. */
  accountMenuAtTop?: boolean;
  /** Replaces breadcrumbs with persistent, Chrome-style workspace tabs. */
  workspaceTabs?: boolean;
  /** Destination the + button opens. Defaults to `defaultRoute`. */
  newTabTarget?: string;
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
  menuSlot,
  menuAlertCount = 0,
  showTopbar = true,
  accountMenuInSidebar = false,
  accountMenuAtTop = false,
  workspaceTabs = false,
  newTabTarget,
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
    !showTopbar && "cs-shell--no-topbar",
    workspaceTabs && "cs-shell--workspace-tabs",
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

          {accountMenuInSidebar && accountMenuAtTop && (
            <SidebarAccountMenu
              profile={profile}
              rolePill={rolePill}
              showOnlineDot={showOnlineDot}
              showSecurity={showSecurity}
              menuSlot={menuSlot}
              menuAlertCount={menuAlertCount}
              position="top"
              onNavigate={navigate}
            />
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

          {accountMenuInSidebar && !accountMenuAtTop ? (
            <SidebarAccountMenu
              profile={profile}
              rolePill={rolePill}
              showOnlineDot={showOnlineDot}
              showSecurity={showSecurity}
              menuSlot={menuSlot}
              menuAlertCount={menuAlertCount}
              onNavigate={navigate}
            />
          ) : !accountMenuInSidebar ? (
            <div className="cs-user">
              <Avatar initials={profile.initials} online={showOnlineDot} />
              <ProfileSummary profile={profile} />
              <span className="pm-pill">{rolePill}</span>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="cs-content">
        {showTopbar && workspaceTabs ? (
          <WorkspaceTabsBar
            nav={nav}
            activeTarget={currentCrumbTarget}
            storageKey={`${basePath}.workspaceTabs`}
            newTabTarget={newTabTarget ?? defaultRoute}
            showBrand={brandInTopbar}
            onMenu={() => setMobileOpen((open) => !open)}
            onNavigate={navigate}
          />
        ) : showTopbar ? (
          <AppTopBar
            rootLabel={rootLabel}
            title={titles[base] || titles[defaultRoute] || rootLabel}
            searchPlaceholder={searchPlaceholder}
            showSearch={showSearch}
            showSearchHint={showSearchHint}
            showSecurity={showSecurity}
            showBrand={brandInTopbar}
            rightSlot={rightSlot}
            menuSlot={accountMenuInSidebar ? undefined : menuSlot}
            menuAlertCount={accountMenuInSidebar ? 0 : menuAlertCount}
            profile={profile}
            onMenu={() => setMobileOpen((open) => !open)}
            onNavigate={navigate}
            rootTarget={defaultRoute}
            currentTarget={currentCrumbTarget}
          />
        ) : (
          <button
            type="button"
            className="cs-mobile-menu cs-mobile-menu--floating"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}
        <main className="cs-page">{children}</main>
      </div>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: ShellProfile }) {
  return (
    <div className="cs-user-details" style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.email}</div>
    </div>
  );
}

function SidebarAccountMenu({
  profile,
  rolePill,
  showOnlineDot,
  showSecurity,
  menuSlot,
  menuAlertCount,
  position = "bottom",
  onNavigate,
}: {
  profile: ShellProfile;
  rolePill: string;
  showOnlineDot?: boolean;
  showSecurity: boolean;
  menuSlot?: ReactNode;
  menuAlertCount: number;
  position?: "top" | "bottom";
  onNavigate: (target: string) => void;
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

  const navigateAndClose = (target: string) => {
    setOpen(false);
    onNavigate(target);
  };

  return (
    <div ref={ref} className={`cs-sidebar-account cs-sidebar-account--${position}`}>
      {open && (
        <div className={"cs-menu cs-menu--sidebar" + (menuSlot ? " cs-menu--account" : "")} role="menu">
          <div className="cs-menu-header">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{profile.email}</div>
          </div>
          {menuSlot}
          <button className="cs-menu-item" onClick={() => navigateAndClose("settings")}>
            <IconUser size={15} /> Profile &amp; preferences
          </button>
          {showSecurity && (
            <button className="cs-menu-item">
              <IconShield size={15} /> Security
            </button>
          )}
          <div className="cs-menu-sep" />
          <button className="cs-menu-item cs-menu-item--danger" onClick={() => navigateAndClose("__signout")}>
            <IconLogout size={15} /> Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        className={`cs-user cs-user--trigger${position === "top" ? " cs-user--bare" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile and workspace menu"
      >
        <Avatar initials={profile.initials} online={showOnlineDot} />
        <ProfileSummary profile={profile} />
        {menuAlertCount > 0 ? (
          <span className="cs-user-alert" aria-label={`${menuAlertCount} unread`}>
            {menuAlertCount > 9 ? "9+" : menuAlertCount}
          </span>
        ) : (
          <span className="pm-pill">{rolePill}</span>
        )}
        <IconChevronDown size={13} className="cs-user-chevron" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Chrome-style workspace tabs.
 *
 * Tabs are tracked by *position*, not by id, because the sidebar reuses the active tab rather
 * than opening a new one — clicking "Projects" retargets whichever tab you are standing in, the
 * way a browser sidebar does. Only the + button ever grows the strip, so two tabs can
 * legitimately hold the same destination and an id-keyed list would collapse them into one.
 */
function WorkspaceTabsBar({
  nav,
  activeTarget,
  storageKey,
  newTabTarget,
  showBrand,
  onMenu,
  onNavigate,
}: {
  nav: ShellNavItem[];
  activeTarget: string;
  storageKey: string;
  newTabTarget: string;
  showBrand: boolean;
  onMenu: () => void;
  onNavigate: (target: string) => void;
}) {
  const router = useRouter();
  const [openTabs, setOpenTabs] = useState<string[]>([activeTarget]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const landingTarget = useRef(activeTarget);
  const lastSeenTarget = useRef(activeTarget);
  const validTabIdKey = nav.map((item) => item.id).join(TAB_ID_SEPARATOR);

  useEffect(() => {
    const validIds = new Set(validTabIdKey.split(TAB_ID_SEPARATOR));
    let stored: string[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string" && validIds.has(id));
    } catch {
      stored = [];
    }

    if (stored.length > 0) {
      const landing = landingTarget.current;
      const restoredIndex = stored.indexOf(landing);
      if (restoredIndex >= 0) {
        setOpenTabs(stored);
        setActiveIndex(restoredIndex);
      } else {
        // The route we landed on was not among the restored tabs, so it takes over the first
        // slot rather than appending — reopening the console must not accumulate tabs.
        setOpenTabs([landing, ...stored.slice(1)]);
        setActiveIndex(0);
      }
    }
    setReady(true);
  }, [storageKey, validTabIdKey]);

  // Navigation that did not come from the tab strip — a sidebar click, an in-page link, the
  // browser back button — retargets the tab you are already standing in.
  //
  // Gated on the route actually changing, not on activeIndex: selecting, adding and closing
  // tabs all move activeIndex first and navigate after, so an index-triggered run would fire
  // while `activeTarget` still names the tab you just left and write it into the new slot.
  useEffect(() => {
    if (lastSeenTarget.current === activeTarget) return;
    lastSeenTarget.current = activeTarget;
    setOpenTabs((current) => {
      if (current[activeIndex] === activeTarget) return current;
      const next = [...current];
      next[activeIndex] = activeTarget;
      return next;
    });
  }, [activeTarget, activeIndex]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(openTabs));
  }, [openTabs, ready, storageKey]);

  const navById = new Map(nav.map((item) => [item.id, item]));

  const selectTab = (index: number) => {
    setActiveIndex(index);
    onNavigate(openTabs[index]);
  };

  const addTab = () => {
    setOpenTabs((current) => [...current, newTabTarget]);
    setActiveIndex(openTabs.length);
    onNavigate(newTabTarget);
  };

  const closeTab = (index: number) => {
    if (openTabs.length <= 1) return;
    const nextTabs = openTabs.filter((_, position) => position !== index);
    setOpenTabs(nextTabs);

    if (index === activeIndex) {
      const nextIndex = Math.min(index, nextTabs.length - 1);
      setActiveIndex(nextIndex);
      onNavigate(nextTabs[nextIndex]);
    } else if (index < activeIndex) {
      // Everything after the removed tab shifted left; the active route did not change.
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <header className="cs-topbar cs-workspace-topbar">
      <div className="cs-workspace-topbar-inner">
        <div className="cs-workspace-brand-zone">
          <button className="cs-mobile-menu" onClick={onMenu} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {showBrand && <Logo size={14} />}
        </div>

        <div className="cs-workspace-history">
          <button type="button" className="cs-workspace-histbtn" aria-label="Go back" onClick={() => router.back()}>
            <IconChevronRight size={15} className="is-flipped" />
          </button>
          <button type="button" className="cs-workspace-histbtn" aria-label="Go forward" onClick={() => router.forward()}>
            <IconChevronRight size={15} />
          </button>
        </div>

        <div className="cs-workspace-tabs-region">
          <div className="cs-workspace-tabs-scroll">
            <div className="cs-workspace-tabs" role="tablist" aria-label="Open workspace tabs">
              {openTabs.map((target, index) => {
                const item = navById.get(target);
                if (!item) return null;
                const active = index === activeIndex;
                return (
                  <div
                    key={`${target}-${index}`}
                    className={`cs-workspace-tab${active ? " is-active" : ""}`}
                    role="presentation"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className="cs-workspace-tab-main"
                      onClick={() => selectTab(index)}
                    >
                      <span className="cs-workspace-tab-icon">{item.icon}</span>
                      <span className="cs-workspace-tab-label">{item.label}</span>
                    </button>
                    {openTabs.length > 1 && (
                      <button
                        type="button"
                        className="cs-workspace-tab-close"
                        aria-label={`Close ${typeof item.label === "string" ? item.label : target} tab`}
                        onClick={() => closeTab(index)}
                      >
                        <IconClose size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button type="button" className="cs-workspace-add" aria-label="New tab" onClick={addTab}>
            <IconPlus size={15} />
          </button>
        </div>
      </div>
    </header>
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
  menuSlot,
  menuAlertCount,
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
  menuSlot?: ReactNode;
  menuAlertCount: number;
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
            <button
              className="cs-avatar-trigger"
              onClick={() => setOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={menuAlertCount > 0 ? `Account menu, ${menuAlertCount} unread` : "Account menu"}
            >
              <Avatar initials={profile.initials} size={32} />
              {menuAlertCount > 0 && (
                <span className="cs-avatar-alert" aria-hidden="true">
                  {menuAlertCount > 9 ? "9+" : menuAlertCount}
                </span>
              )}
              <IconChevronDown size={14} style={{ color: "var(--text-3)" }} />
            </button>
            {open && (
              <div className={"cs-menu" + (menuSlot ? " cs-menu--account" : "")}>
                <div className="cs-menu-header">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{profile.email}</div>
                </div>
                {menuSlot}
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
