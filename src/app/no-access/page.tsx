"use client";

import { useAuth } from "@/shared/auth/auth-provider";

/**
 * Terminal "wrong workspace" screen for the internal console.
 *
 * A CLIENT account has no workspace here — the client experience lives in the
 * separate Alphaexplora client app. This page exists so role routing has a real
 * destination for CLIENT: sending them to /sign-in instead would loop, because
 * the sign-in page routes an authenticated user back by role.
 *
 * Deliberately has no <RequireAuth>: it must render for exactly the users the
 * role guards reject.
 */
export default function NoAccessPage() {
  const { devFlowUser, signOut } = useAuth();
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
          {devFlowUser?.email ? <>You are signed in as {devFlowUser.email}. </> : null}
          Client projects are managed in the Alphaexplora client portal, not here.
        </p>

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
