"use client";

import { useAuth } from "@/shared/auth/auth-provider";

/**
 * Terminal staff-only screen for the internal console.
 *
 * Reached when a GitHub account authenticates but is in none of the mapped org teams, which
 * is the only reason access is refused here. There is no approval flow to wait for: a role
 * comes from GitHub team membership, so the fix is to be added to a team. Client accounts
 * belong to the separate Alphaexplora client app.
 *
 * Deliberately has no <RequireAuth>: it must render for exactly the users the guards reject.
 */
export default function NoAccessPage() {
  const { devFlowUser, notATeamMemberMessage, signOut } = useAuth();
  const clientAppUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || "https://alphaexplora.com";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--bg-0, #0a0a0a)",
        color: "var(--text, #f5f7f7)",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <p
          style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-3, #8b8f8f)",
            margin: 0,
          }}
        >
          Internal console
        </p>

        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "12px 0 0" }}>
          This workspace is for staff
        </h1>

        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-2, #b9bcbc)", marginTop: 12 }}>
          {/* The API message names the GitHub login and the teams to ask for. It is the only
              detail available here: a refused sign-in has no DevFlow profile to read. */}
          {notATeamMemberMessage ??
            "Your GitHub account is not a member of a DevFlow team, so there is no workspace for it in this console."}
        </p>

        {devFlowUser?.email && (
          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-3, #8b8f8f)", marginTop: 8 }}>
            Signed in as {devFlowUser.email}.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <a
            href={clientAppUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 18px",
              borderRadius: 2,
              background: "var(--text, #f5f7f7)",
              color: "var(--bg-0, #0a0a0a)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go to the client portal
          </a>

          <button
            type="button"
            onClick={() => void signOut()}
            style={{
              padding: "10px 18px",
              borderRadius: 2,
              background: "transparent",
              color: "var(--text, #f5f7f7)",
              border: "1px solid var(--border-soft, #2a2a2a)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
