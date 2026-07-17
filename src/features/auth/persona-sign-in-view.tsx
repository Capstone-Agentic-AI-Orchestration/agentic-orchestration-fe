"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconGitHub } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { loginPathForRole } from "@/shared/auth/role-routing";
import type { DevFlowUserRole } from "@/shared/api/devflow-api";

export interface PersonaSignInProps {
  /** The persona this entry point is branded for. Cosmetic only — the actual
   *  workspace a user reaches is decided by their backend role, not this page. */
  persona: Extract<DevFlowUserRole, "DEV" | "PM">;
  title: string;
  subtitle: string;
  /** Default post-login destination when no ?next= is present. */
  homePath: string;
  accent: string;
}

export function PersonaSignInView({ persona, title, subtitle, homePath, accent }: PersonaSignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithOAuth, devFlowUser, user, initialized, refreshDevFlowUser } = useAuth();
  const nextPath = searchParams.get("next") ?? homePath;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  // A visitor who already has a session is sent to their real workspace by role
  // (loginPathForRole), so the URL of this page never grants access on its own.
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
  const personaLabel = persona === "PM" ? "Project Manager" : "Developer";

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
            color: accent,
            border: `1px solid ${accent}55`,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          {personaLabel} workspace
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "18px 0 0" }}>{title}</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>{subtitle}</p>

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
              {submitting ? "Signing in..." : `Sign in to ${personaLabel} workspace`}
            </button>
          </form>
        </div>

        <button
          type="button"
          className="auth-link auth-link-btn"
          onClick={() => router.push("/client/sign-in")}
          style={{ marginTop: 18, fontSize: 13, color: "var(--text-2)" }}
        >
          Not a {personaLabel.toLowerCase()}? Go to client sign in
        </button>
      </div>
    </div>
  );
}

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
