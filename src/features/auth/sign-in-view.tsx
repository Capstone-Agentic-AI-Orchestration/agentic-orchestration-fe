"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft, IconGitHub } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { loginPathForRole } from "@/shared/auth/role-routing";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import { Logo } from "@/shared/components/ui";

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
  const {
    signInWithGithub,
    devFlowUser,
    devFlowUserError,
    notATeamMember,
    notATeamMemberMessage,
    user,
    initialized,
    refreshDevFlowUser,
    signOut,
  } = useAuth();
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

  /**
   * A GitHub sign-in the backend rejects has to say so *here*.
   *
   * <RequireAuth> owns the /no-access redirect, but it does not wrap this page — /sign-in is
   * public by design. So without this the OAuth round-trip lands back on an unchanged screen:
   * the visitor sees nothing happen, presses the button again, GitHub replies instantly
   * (already authorised) and they loop forever with no idea why. Both refusal shapes are
   * surfaced because they have different fixes: NOT_A_TEAM_MEMBER is a GitHub org change,
   * while any other error is the API being unreachable or misconfigured.
   */
  const blocked = notATeamMember || Boolean(devFlowUserError);
  const blockedTitle = notATeamMember
    ? "This GitHub account has no DevFlow workspace"
    : "Signed in with GitHub, but DevFlow could not confirm your role";
  const blockedDetail = notATeamMember
    ? (notATeamMemberMessage ?? "Your GitHub account is not in a DevFlow team.")
    : compactDevFlowError(devFlowUserError ?? "");

  const startOver = async () => {
    await signOut().catch(() => null);
    setError("");
    setSubmitting(false);
  };

  return (
    <div className="auth-access-shell">
      <header className="auth-access-header">
        <Link href="/" className="auth-access-logo" aria-label="Back to Alphaexplora landing page">
          <Logo size={18} />
        </Link>
        <Link href="/" className="auth-access-back">
          <IconArrowLeft size={15} />
          Back to landing page
        </Link>
      </header>

      <main className="auth-access-main">
        <section className="auth-access-intro" aria-labelledby="sign-in-heading">
          <span className="auth-access-kicker">DevFlow internal console</span>
          <h1 id="sign-in-heading">Your team&apos;s workspace, ready when you are.</h1>
          <p>
            Sign in once and DevFlow takes you to the right workspace — whether you are a project manager or a developer.
          </p>
          <div className="auth-access-roles" aria-label="Available workspaces">
            <span>Project managers</span>
            <span>Developers</span>
          </div>
        </section>

        <section className="auth-access-signin" aria-label="Sign in to DevFlow">
          <span className="auth-access-kicker">Secure access</span>
          <h2>Sign in to DevFlow</h2>
          <p>
            Your role is verified through the <strong>{GITHUB_ORG_LABEL}</strong> GitHub organisation.
          </p>
          {blocked && (
            <div
              className="auth-access-error"
              role="alert"
              style={{ display: "grid", gap: 6, textAlign: "left" }}
            >
              <strong>{blockedTitle}</strong>
              <span>{blockedDetail}</span>
            </div>
          )}

          <button
            type="button"
            onClick={blocked ? startOver : startGithub}
            disabled={submitting}
            className="auth-access-submit"
          >
            <IconGitHub size={18} />
            {blocked
              ? "Sign out and use another GitHub account"
              : submitting
                ? "Opening GitHub..."
                : "Continue with GitHub"}
          </button>

          {error && (
            <div className="auth-access-error">{error}</div>
          )}

          <p className="auth-access-note">
            No account to create: your DevFlow role comes from your GitHub team. If sign-in is
            refused, ask a project manager to add you to the developer or project-manager team.
          </p>
        </section>
      </main>
    </div>
  );
}

const GITHUB_ORG_LABEL = "Capstone-Agentic-AI-Orchestration";
