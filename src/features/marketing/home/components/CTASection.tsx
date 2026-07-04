"use client";

/**
 * CTASection — Final call to action.
 * Terminal-style block with a mock command + a real email + brief form.
 * Subtle border pulse on the terminal, disabled on reduced-motion.
 */

import { useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { SectionReveal } from "@/shared/components/layout/SectionReveal";
import { createDevFlowInquiry } from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import "./CTASection.css";

export function CTASection() {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (!brief.trim() || brief.trim().length < 10) {
      setError("Brief should be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await createDevFlowInquiry({
        companyName: "TBD",
        contactName: email.trim().split("@")[0] ?? "TBD",
        email: email.trim(),
        brief: brief.trim(),
      });
      setSubmitted(true);
      setEmail("");
      setBrief("");
    } catch (err) {
      setError(compactDevFlowError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionReveal as="section" className="cta" id="cta">
      <div className="cta-inner">
        <div className="cta-terminal">
          <div className="cta-terminal-header">
            <div className="cta-terminal-dots">
              <span /><span /><span />
            </div>
            <span className="cta-terminal-label">devflow — start</span>
          </div>
          <pre className="cta-terminal-body">
            <code>
              <span className="cta-prompt">$</span>{" "}
              <span className="cta-cmd">devflow</span>{" "}
              <span className="cta-flag">start</span>
              {brief.trim() && (
                <>
                  {" "}
                  <span className="cta-flag">--brief</span>{" "}
                  <span className="cta-arg">&quot;{brief.trim()}&quot;</span>
                </>
              )}
            </code>
            <div className={`cta-terminal-glow ${reduced ? "is-static" : ""}`} aria-hidden="true" />
          </pre>
        </div>

        <form className="cta-form" onSubmit={handleSubmit}>
          {submitted ? (
            <div className="cta-success">
              <p className="cta-success-title">Brief received.</p>
              <p className="cta-success-body">
                You&apos;ll get a scoped contract back shortly. Watch your inbox.
              </p>
            </div>
          ) : (
            <>
              <div className="cta-field">
                <label htmlFor="cta-email" className="cta-label">
                  email
                </label>
                <input
                  id="cta-email"
                  type="email"
                  className="cta-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>

              <div className="cta-field">
                <label htmlFor="cta-brief" className="cta-label">
                  brief
                </label>
                <textarea
                  id="cta-brief"
                  className="cta-textarea"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="What do you want built?"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              {error && <p className="cta-error">{error}</p>}

              <button
                type="submit"
                className="cta-button"
                disabled={submitting}
              >
                {submitting ? "Starting..." : "Start →"}
              </button>
            </>
          )}
        </form>

        <p className="cta-foot">
          No credit card. Production-grade output. Repo ownership from day one.
        </p>
      </div>
    </SectionReveal>
  );
}
