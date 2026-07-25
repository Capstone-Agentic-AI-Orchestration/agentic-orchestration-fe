"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconGitHub } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { loginPathForRole } from "@/shared/auth/role-routing";

/**
 * The single sign-in surface for the internal DevFlow console.
 *
 * GitHub is the only way in: access is granted by membership of a team in the GitHub
 * organisation, and no other provider can be resolved to a DEV or PM role. There is
 * deliberately one entry point for every staff role — the workspace a person lands in is
 * decided by their backend profile, never by which URL they opened. (Separate /dev and /pm
 * login pages used to exist and were pure duplication: same form, different wording.)
 */
export function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGithub, devFlowUser, user, initialized, refreshDevFlowUser } = useAuth();
  // No default: loginPathForRole falls back to the role's own home when `next` is absent
  // or points outside that role's workspace.
  const nextPath = searchParams.get("next");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // A visitor who already has a session is sent to their real workspace by role, so the URL
  // of this page never grants access on its own.
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
    setSubmitting(true);
    try {
      await signInWithGithub(nextPath);
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Unable to start GitHub sign in.");
    }
  };

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
          Your workspace is set by your team in the{" "}
          <strong style={{ color: "var(--text-1, white)", fontWeight: 600 }}>{GITHUB_ORG_LABEL}</strong>{" "}
          organisation. Developers and project managers both sign in here.
        </p>

        <div className="auth-form-fields" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={startGithub}
            disabled={submitting}
            className="pricing-cta-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", height: 48, borderRadius: 999,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
              color: "white", fontWeight: 500, fontSize: 14.5,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
            }}
          >
            <IconGitHub size={18} />
            {submitting ? "Opening GitHub..." : "Continue with GitHub"}
          </button>

          {error && (
            <div style={{ color: "var(--danger, #ef4444)", fontSize: 13, marginTop: 12 }}>{error}</div>
          )}

          <p style={{ fontSize: 12.5, color: "var(--text-3, var(--text-2))", marginTop: 14, lineHeight: 1.55 }}>
            No account to create: your DevFlow role comes from your GitHub team. If sign-in is
            refused, ask a project manager to add you to the developer or project-manager team.
          </p>
        </div>

        {/* Client sign-in lives in the separate Alphaexplora client app; this console has
            no client access at all, so there is nothing to link to here. */}
      </div>
    </div>
  );
}

const ACCENT = "#818CF8";
const GITHUB_ORG_LABEL = "Capstone-Agentic-AI-Orchestration";
