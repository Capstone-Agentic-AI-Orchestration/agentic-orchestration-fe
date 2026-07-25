"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconGitHub } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { loginPathForRole } from "@/shared/auth/role-routing";

/**
 * The single sign-in surface for the internal DevFlow console.
 *
 * There is deliberately ONE entry point for every staff role. The workspace a
 * person lands in (DEV / PM / ADMIN) is decided by the role on their backend
 * profile — resolved from GitHub org team membership — never by which URL they
 * opened. Separate /dev and /pm login pages used to exist and were pure
 * duplication: they rendered this same form and only differed in wording, which
 * implied the choice mattered and misled anyone who picked the "wrong" one.
 */
export function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithOAuth, devFlowUser, user, initialized, refreshDevFlowUser } = useAuth();
  // No persona default: loginPathForRole falls back to the role's own home when
  // `next` is absent or points outside the role's workspace.
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  // A visitor who already has a session is sent to their real workspace by role,
  // so the URL of this page never grants access on its own.
  useEffect(() => {
    if (!initialized || !user || devFlowUser) return;
    refreshDevFlowUser().catch(() => null);
  }, [initialized, user, devFlowUser, refreshDevFlowUser]);

  useEffect(() => {
    if (!devFlowUser) return;
    router.replace(loginPathForRole(devFlowUser.role, nextPath));
  }, [devFlowUser, nextPath, router]);

  const startGithub = async () => {
    setError("");
    setOauthSubmitting(true);
    try {
      await signInWithOAuth("github", nextPath);
    } catch (e) {
      setOauthSubmitting(false);
      setError(e instanceof Error ? e.message : "Unable to start GitHub sign in.");
    }
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const signedIn = await signIn(email.trim(), password);
      router.replace(loginPathForRole(signedIn.role, nextPath));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || oauthSubmitting;

  return (
    <div className="auth-route-state">
      <div className="auth-route-card" style={{ maxWidth: 440, width: "100%", textAlign: "left" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: ACCENT,
            border: `1px solid ${ACCENT}55`,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          Internal console
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "18px 0 0" }}>
          Sign in to DevFlow
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
          Continue with GitHub — your workspace is set by your team in the{" "}
          <strong style={{ color: "var(--text-1, white)", fontWeight: 600 }}>
            {GITHUB_ORG_LABEL}
          </strong>{" "}
          organisation. Project managers and developers both sign in here.
        </p>

        <div className="auth-form-fields" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={startGithub}
            disabled={busy}
            className="pricing-cta-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", height: 48, borderRadius: 999,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
              color: "white", fontWeight: 500, fontSize: 14.5,
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
            }}
          >
            <IconGitHub size={18} />
            {oauthSubmitting ? "Opening GitHub..." : "Continue with GitHub"}
          </button>

          <p style={{ fontSize: 12.5, color: "var(--text-3, var(--text-2))", marginTop: 10, lineHeight: 1.5 }}>
            GitHub is the recommended route for staff: it is the only method that can read your
            team membership and grant your DEV or PM workspace automatically.
          </p>

          <div className="auth-premium-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={submitEmail} noValidate>
            <label style={{ fontSize: 13, color: "var(--text-2)" }}>
              Work Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 13, color: "var(--text-2)", display: "block", marginTop: 12 }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={inputStyle}
              />
            </label>

            {error && (
              <div style={{ color: "var(--danger, #ef4444)", fontSize: 13, marginTop: 12 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary"
              style={{ width: "100%", height: 46, marginTop: 18, borderRadius: 999, opacity: busy ? 0.6 : 1 }}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* The client sign-in lives in the separate Alphaexplora client app, so
            this internal console no longer links to it. */}
      </div>
    </div>
  );
}

const ACCENT = "#818CF8";
const GITHUB_ORG_LABEL = "Capstone-Agentic-AI-Orchestration";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  marginTop: 6,
  padding: "0 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "white",
  fontSize: 14,
};
