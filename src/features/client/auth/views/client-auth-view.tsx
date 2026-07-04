// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input, Logo } from "@/shared/components/ui";
import { IconArrowLeft, IconArrowRight, IconArrowUpRight, IconCheck, IconEye, IconEyeOff, IconGitHub, IconMail, IconShield, IconSparkles } from "@/shared/components/icons";
import { useAuth } from "@/shared/auth/auth-provider";
import { loginPathForRole } from "@/shared/auth/role-routing";
import { getDevFlowClientInviteStatus } from "@/shared/api/devflow-api";

const BRAND_HEADINGS = {
  "sign-in": <>Welcome back to <span className="gradient-text">Alphaexplora.</span></>,
  "sign-up": <>One last step to start your <span className="gradient-text">engagement.</span></>,
  forgot: <>No worries, we'll get you <span className="gradient-text">back in.</span></>,
  reset: <>Choose a new <span className="gradient-text">password.</span></>,
};

const BRAND_SUBS = {
  "sign-in": "Track your engagement, message your project manager, review documents, and approve deliverables in one secure place.",
  "sign-up": "Complete your account setup to access your client dashboard and collaborate with your delivery team.",
  forgot: "Enter the email address associated with your account and we'll send you a secure recovery link.",
  reset: "Your new password must be at least 8 characters and should not match any previous passwords.",
};

/* ---------- Tokenized heading with staggered word reveal ---------- */
function SplitHeading({ text, gradientWord }) {
  const [before, after] = gradientWord ? text.split(gradientWord) : [text, ""];
  const words = before.split(" ");
  return (
    <h1 className="auth-premium-heading">
      {words.map((word, i) => (
        <span key={i} className="auth-word-reveal" style={{"--word-delay": `${i * 60 + 200}ms`}}>
          {word}{" "}
        </span>
      ))}
      {gradientWord && (
        <span className="gradient-text auth-word-reveal" style={{"--word-delay": `${(words.length) * 60 + 200}ms`}}>
          {gradientWord}{" "}
        </span>
      )}
      {after && (
        <span className="auth-word-reveal" style={{"--word-delay": `${(words.length + 1) * 60 + 200}ms`}}>
          {after}
        </span>
      )}
    </h1>
  );
}

/* ---------- Premium Brand Panel (Editorial Split - Left) ---------- */
function AuthBrandPanel({ heading, sub }) {
  const router = useRouter();
  const headingText = typeof heading === "object" ? "Enterprise IT, intelligently delivered." : "";
  return (
    <aside className="auth-premium-brand">
      <div className="auth-premium-orb auth-premium-orb--1" />
      <div className="auth-premium-orb auth-premium-orb--2" />
      <div className="auth-premium-orb auth-premium-orb--3" />
      <button type="button" className="auth-brand-logo" onClick={() => router.push("/")} aria-label="Back to home">
        <Logo />
      </button>
      <div style={{ marginTop: 48 }}>
        <SplitHeading text="Enterprise IT, intelligently delivered." gradientWord="intelligently" />
        <p className="auth-premium-sub">{sub}</p>
      </div>
      <div className="auth-premium-testimonial">
        <div className="row gap-3" style={{ alignItems: "flex-start" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #10B981, #14B8A6)",
            display: "grid", placeItems: "center",
            color: "white", fontWeight: 700, fontSize: 15,
            flexShrink: 0,
          }}>
            AV
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
              From kickoff to production deploy in twelve business days.
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "white" }}>Aileen V.</span>
              <span style={{ color: "var(--text-3)", fontSize: 12 }}>CTO, Tindahan PH</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Button-in-Button CTA ---------- */
function AuthSubmitButton({ children, submitting, ...props }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
        width: "100%", height: 52,
        padding: "0 24px 0 28px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
        border: "none",
        color: "white",
        fontWeight: 600, fontSize: 15,
        cursor: submitting ? "not-allowed" : "pointer",
        opacity: submitting ? 0.6 : 1,
        boxShadow: "0 8px 28px rgba(47,107,255,0.35)",
        transition: "all 0.7s cubic-bezier(0.32,0.72,0,1)",
        position: "relative",
        overflow: "hidden",
      }}
      className="auth-premium-submit pricing-cta-btn"
      {...props}
    >
      {submitting ? "Signing in..." : children}
      <span style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.7s cubic-bezier(0.32,0.72,0,1)",
        flexShrink: 0,
      }} className="pricing-cta-icon">
        <IconArrowUpRight size={14} />
      </span>
    </button>
  );
}

/* ---------- Custom checkbox ---------- */
function PremiumCheckbox({ checked, onChange, children }) {
  return (
    <label className="auth-premium-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check-box">
        {checked && <IconCheck size={10} stroke={3} style={{ color: "white" }} />}
      </span>
      {children}
    </label>
  );
}

/* ---------- Password Input ---------- */
function PasswordInput({ value, onChange, placeholder = "Password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        className="auth-input-toggle"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  );
}

/* ---------- Sign In Form (Premium) ---------- */
function SignInForm({ onDone }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithOAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const user = await signIn(form.email.trim(), form.password);
      onDone(user.role);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const startGithub = async () => {
    setSubmitError("");
    setOauthSubmitting(true);
    try {
      await signInWithOAuth("github", searchParams.get("next"));
    } catch (error) {
      setOauthSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Unable to start GitHub sign in.");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
        Sign in to your dashboard
      </h1>
      <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
        Use your GitHub account to access your assigned DevFlow workspace.
      </p>

      <div className="auth-form-fields" style={{ marginTop: 28 }}>
        <button
          type="button"
          onClick={startGithub}
          disabled={oauthSubmitting || submitting}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", height: 48,
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "white",
            fontWeight: 500, fontSize: 14.5,
            cursor: oauthSubmitting || submitting ? "not-allowed" : "pointer",
            opacity: oauthSubmitting || submitting ? 0.6 : 1,
            transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)",
          }}
          className="pricing-cta-btn"
        >
          <IconGitHub size={18} />
          {oauthSubmitting ? "Opening GitHub..." : "Continue with GitHub"}
        </button>

        <div className="auth-premium-divider">
          <span>or sign in with email</span>
        </div>

        <Field label="Work Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>

        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <PremiumCheckbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Remember me for 30 days
          </PremiumCheckbox>
          <button
            type="button"
            className="auth-link auth-link-btn"
            onClick={() => router.push("/client/forgot")}
          >
            Forgot password?
          </button>
        </div>

        {submitError && <div className="auth-inline-error">{submitError}</div>}

        <AuthSubmitButton submitting={submitting}>
          Sign In
        </AuthSubmitButton>

        <div className="row gap-2" style={{ justifyContent: "center", marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>
          <IconShield size={13} /> Secure, end-to-end encrypted session
        </div>
      </div>

      <div className="auth-switch">
        Don't have an account?{" "}
        <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/client/sign-up")}>
          Sign up
        </button>
      </div>
    </form>
  );
}

/* ---------- Sign Up Form (keeps existing logic, premium styling) ---------- */
function SignUpForm({ initialEmail = "", onDone }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithOAuth, signUp } = useAuth();
  const [form, setForm] = useState({ email: initialEmail, password: "", confirm: "", terms: false });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    if (form.password !== form.confirm) next.confirm = "Passwords don't match";
    if (!form.terms) next.terms = "Please accept the terms to continue";
    setErrors(next);
    setSubmitError("");
    setSubmitNotice("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const invite = await getDevFlowClientInviteStatus(form.email.trim());
      if (invite.pending === 0 && invite.accepted === 0) {
        setSubmitError("No approved client invitation was found for this email. Submit an inquiry first or ask your PM to approve the request.");
        return;
      }
      const user = await signUp(form.email.trim(), form.password);
      if (!user) {
        setSubmitNotice("Check your email to confirm the account, then sign in with this address.");
        return;
      }
      onDone(user.role);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const startGithub = async () => {
    setSubmitError("");
    setOauthSubmitting(true);
    try {
      await signInWithOAuth("github", searchParams.get("next"));
    } catch (error) {
      setOauthSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Unable to start GitHub sign up.");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div style={{
        padding: 16, borderRadius: 16,
        background: "rgba(47,107,255,0.08)",
        border: "1px solid rgba(79,139,255,0.25)",
        display: "flex", gap: 12, marginBottom: 24,
      }}>
        <IconMail size={18} style={{ color: "#93C5FD", flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
          <strong style={{ color: "white" }}>You were invited by Alphaexplora.</strong> Complete your account to access your client dashboard.
        </div>
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>Create your account</h1>
      <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
        Use GitHub to finish onboarding and access your assigned role.
      </p>
      <div className="auth-form-fields" style={{ marginTop: 28 }}>
        <button
          type="button"
          onClick={startGithub}
          disabled={oauthSubmitting || submitting}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", height: 48,
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "white", fontWeight: 500, fontSize: 14.5,
            cursor: oauthSubmitting || submitting ? "not-allowed" : "pointer",
            opacity: oauthSubmitting || submitting ? 0.6 : 1,
            transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)",
          }}
          className="pricing-cta-btn"
        >
          <IconGitHub size={18} />
          {oauthSubmitting ? "Opening GitHub..." : "Continue with GitHub"}
        </button>

        <div className="auth-premium-divider"><span>or create a password</span></div>

        <Field label="Work Email" error={errors.email} helper="Use the email from your invitation.">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </Field>
        <Field label="Set Password" error={errors.password}>
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm Password" error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Re-enter password" />
        </Field>
        <label className="auth-premium-checkbox" style={{ alignItems: "flex-start", gap: 10 }}>
          <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
          <span className="check-box" style={{ marginTop: 1 }}>
            {form.terms && <IconCheck size={10} stroke={3} style={{ color: "white" }} />}
          </span>
          I agree to Alphaexplora's Terms of Service and Privacy Policy.
        </label>
        {errors.terms && <span className="field-error">{errors.terms}</span>}
        {submitError && <div className="auth-inline-error">{submitError}</div>}
        {submitNotice && <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,185,129,.10)", border: "1px solid rgba(16,185,129,.25)", color: "#B7F7D8", fontSize: 13, lineHeight: 1.5 }}>{submitNotice}</div>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", height: 52,
            padding: "0 24px 0 28px", borderRadius: 999,
            background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
            border: "none", color: "white",
            fontWeight: 600, fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            boxShadow: "0 8px 28px rgba(47,107,255,0.35)",
            transition: "all 0.7s cubic-bezier(0.32,0.72,0,1)",
          }}
          className="auth-premium-submit pricing-cta-btn"
        >
          {submitting ? "Creating account..." : "Create Account & Sign In"}
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.7s cubic-bezier(0.32,0.72,0,1)",
            flexShrink: 0,
          }} className="pricing-cta-icon">
            <IconArrowUpRight size={14} />
          </span>
        </button>
      </div>
      <div className="auth-switch" style={{ marginTop: 28 }}>
        Already have an account?{" "}
        <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/client/sign-in")}>
          Sign in
        </button>
      </div>
    </form>
  );
}

/* ---------- Forgot Password Form ---------- */
function ForgotForm() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #10B981, #14B8A6)",
          display: "grid", placeItems: "center",
          margin: "0 auto 24px",
          boxShadow: "0 12px 32px rgba(16,185,129,0.30)",
        }}>
          <IconCheck size={28} stroke={3} style={{ color: "white" }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>Check your inbox</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: "none" }}>
          We sent a reset link to <strong style={{ color: "white" }}>{email}</strong>.
        </p>
        <Button variant="secondary" size="lg" style={{ width: "100%", marginTop: 24, borderRadius: 999 }} onClick={() => setSent(false)}>
          Try another email
        </Button>
        <div className="auth-switch" style={{ marginTop: 20 }}>
          Remembered it?{" "}
          <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/client/sign-in")}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>Forgot your password?</h1>
      <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
        We will email you a secure link to reset it.
      </p>
      <div className="auth-form-fields" style={{ marginTop: 28 }}>
        <Field label="Work Email" error={error}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", height: 52,
            padding: "0 24px 0 28px", borderRadius: 999,
            background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
            border: "none", color: "white",
            fontWeight: 600, fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            boxShadow: "0 8px 28px rgba(47,107,255,0.35)",
            transition: "all 0.7s cubic-bezier(0.32,0.72,0,1)",
          }}
          className="auth-premium-submit pricing-cta-btn"
        >
          {submitting ? "Sending..." : "Send reset link"}
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.7s cubic-bezier(0.32,0.72,0,1)",
            flexShrink: 0,
          }} className="pricing-cta-icon">
            <IconArrowUpRight size={14} />
          </span>
        </button>
      </div>
      <div className="auth-switch" style={{ marginTop: 28 }}>
        Remembered your password?{" "}
        <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/client/sign-in")}>
          Sign in
        </button>
      </div>
    </form>
  );
}

/* ---------- Reset Password Form ---------- */
function ResetForm({ onDone }) {
  const { updatePassword } = useAuth();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    if (form.password !== form.confirm) next.confirm = "Passwords don't match";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await updatePassword(form.password);
      setDone(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #10B981, #14B8A6)",
          display: "grid", placeItems: "center",
          margin: "0 auto 24px",
          boxShadow: "0 12px 32px rgba(16,185,129,0.30)",
        }}>
          <IconCheck size={28} stroke={3} style={{ color: "white" }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>All set!</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: "none" }}>
          Your password has been updated.
        </p>
        <button
          type="button"
          onClick={onDone}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", height: 52,
            padding: "0 24px 0 28px", borderRadius: 999,
            background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
            border: "none", color: "white",
            fontWeight: 600, fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 8px 28px rgba(47,107,255,0.35)",
            transition: "all 0.7s cubic-bezier(0.32,0.72,0,1)",
            marginTop: 24,
          }}
          className="pricing-cta-btn"
        >
          Continue to sign in
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.7s cubic-bezier(0.32,0.72,0,1)",
            flexShrink: 0,
          }} className="pricing-cta-icon">
            <IconArrowUpRight size={14} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>Reset your password</h1>
      <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
        Choose a strong password for your account.
      </p>
      <div className="auth-form-fields" style={{ marginTop: 28 }}>
        <Field label="New Password" error={errors.password}>
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm New Password" error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Re-enter password" />
        </Field>
        {submitError && <div className="auth-inline-error">{submitError}</div>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", height: 52,
            padding: "0 24px 0 28px", borderRadius: 999,
            background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
            border: "none", color: "white",
            fontWeight: 600, fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            boxShadow: "0 8px 28px rgba(47,107,255,0.35)",
            transition: "all 0.7s cubic-bezier(0.32,0.72,0,1)",
          }}
          className="auth-premium-submit pricing-cta-btn"
        >
          {submitting ? "Updating..." : "Reset password"}
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.7s cubic-bezier(0.32,0.72,0,1)",
            flexShrink: 0,
          }} className="pricing-cta-icon">
            <IconArrowUpRight size={14} />
          </span>
        </button>
      </div>
      <div className="auth-switch" style={{ marginTop: 28 }}>
        Remembered it?{" "}
        <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/client/sign-in")}>
          Sign in
        </button>
      </div>
    </form>
  );
}

/* ================================================================
   EXPORTED: ClientAuthView
   ================================================================ */
export function ClientAuthView({ mode = "sign-in" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { devFlowUser, devFlowUserError, initialized, refreshDevFlowUser, user } = useAuth();

  useEffect(() => {
    if (!initialized || !user || devFlowUser || devFlowUserError) return;
    refreshDevFlowUser().catch(() => null);
  }, [devFlowUser, devFlowUserError, initialized, refreshDevFlowUser, user]);

  useEffect(() => {
    if (!devFlowUser) return;
    router.replace(loginPathForRole(devFlowUser.role, nextPath));
  }, [devFlowUser, nextPath, router]);

  return (
    <div className="auth-premium-shell" data-screen-label={`Client Auth - ${mode}`}>
      <AuthBrandPanel heading={BRAND_HEADINGS[mode]} sub={BRAND_SUBS[mode]} />
      <main className="auth-premium-form-side">
        <button type="button" className="auth-premium-back" onClick={() => router.push("/")}>
          <IconArrowLeft size={14} /> Back to home
        </button>

        <div className="auth-premium-card-outer">
          <div className="auth-premium-card-inner">
            {mode === "sign-in" && <SignInForm onDone={(role) => router.push(loginPathForRole(role, nextPath))} />}
            {mode === "sign-up" && <SignUpForm initialEmail={searchParams.get("email") || ""} onDone={(role) => router.push(loginPathForRole(role, nextPath))} />}
            {mode === "forgot" && <ForgotForm />}
            {mode === "reset" && <ResetForm onDone={() => router.push("/client/sign-in")} />}
          </div>
        </div>

        <div style={{
          marginTop: 24,
          fontSize: 12.5,
          color: "var(--text-3)",
          textAlign: "center",
        }}>
          Need help signing in?{" "}
          <button type="button" className="auth-link auth-link-btn">Contact support</button>
        </div>

        <div className="row gap-4" style={{
          marginTop: 40,
          fontSize: 12,
          color: "var(--text-4)",
        }}>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Help</span>
        </div>
      </main>
    </div>
  );
}