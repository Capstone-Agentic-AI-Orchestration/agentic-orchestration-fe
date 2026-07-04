"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, Card, Field, Input, Logo, Textarea } from "@/shared/components/ui";
import { createDevFlowInquiry } from "@/shared/api/devflow-api";
import {
  IconArrowRight,
  IconGitHub,
  IconLinkedIn,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTwitter,
} from "@/shared/components/icons";

type NavigateFn = (route: string, scrollId?: string) => void;

/* ---------- Reveal-on-scroll (subtle fade-up only) ---------- */
export function useReveal() {
  useEffect(() => {
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    const observe = (el: Element) => {
      const node = el as HTMLElement & { __reveal_obs?: boolean };
      if (!node || node.__reveal_obs) return;
      node.__reveal_obs = true;
      const r = node.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        node.classList.add("is-visible");
        return;
      }
      io.observe(node);
    };

    const scan = () => {
      if (cancelled) return;
      document.querySelectorAll("[data-reveal]").forEach(observe);
    };

    scan();
    requestAnimationFrame(() => {
      scan();
      requestAnimationFrame(scan);
    });

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    const safety = setTimeout(() => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
    }, 1500);

    return () => {
      cancelled = true;
      io.disconnect();
      mo.disconnect();
      clearTimeout(safety);
    };
  }, []);
}

/* ---------- Top nav ---------- */
export function TopNav({ route, onNavigate }: { route: string; onNavigate: NavigateFn }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { id: "platform", label: "Platform" },
    { id: "how-it-works", label: "How it works" },
    { id: "pricing", label: "Pricing" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];
  return (
    <nav className={"topnav" + (scrolled ? " scrolled" : "")}>
      <div className="topnav-inner">
        <a className="brand" onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
          <Logo size={22} />
        </a>
        <div className="links">
          {links.map((l) => (
            <a
              key={l.id}
              className={"nlink" + (route === l.id ? " active" : "")}
              onClick={() => (l.id === "contact" ? onNavigate("home", "contact") : onNavigate(l.id))}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="row gap-2">
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/client/sign-in")}>
            Sign in
          </Button>
          <Button variant="primary" size="sm" iconRight={<IconArrowRight />} onClick={() => onNavigate("home", "contact")}>
            Get started
          </Button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Contact closer ---------- */
type ContactForm = { firstName: string; lastName: string; email: string; company: string; phone: string; details: string };

export function ContactCloser({ onSubmitted }: { onSubmitted?: (inquiry: unknown) => void }) {
  const [form, setForm] = useState<ContactForm>({ firstName: "", lastName: "", email: "", company: "", phone: "", details: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.details.trim() || form.details.length < 10) errs.details = "Please share a few details (min 10 characters)";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const inquiry = await createDevFlowInquiry({
        companyName: form.company.trim(),
        contactName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        brief: form.details.trim(),
        stackKey: "nextjs-nestjs-supabase",
      });
      onSubmitted?.(inquiry);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to submit inquiry right now." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <div data-reveal style={{ maxWidth: 640 }}>
          <span className="eyebrow"><span className="dot" /> Get in touch</span>
          <h2 className="h-1 mt-4">Tell us what you want built.</h2>
          <p className="lead mt-4">A project manager reads every inquiry and replies within one to two business days.</p>
        </div>

        <div className="mt-12" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 32 }}>
          <div data-reveal>
            <div className="flex-col gap-4">
              <ContactRow icon={<IconMail size={18} />} label="Email" value="inquire@alphaexplora.com" href="mailto:inquire@alphaexplora.com" />
              <ContactRow
                icon={<IconPhone size={18} />}
                label="Phone"
                value={<>+63 2 70060042 <span style={{ color: "var(--text-4)" }}>·</span> +63 915 8101010</>}
              />
              <ContactRow icon={<IconMapPin size={18} />} label="Headquarters" value="#6 T. Bugallon Street, Marikina Heights, Marikina City, Philippines 1810" />
            </div>

            <div className="mt-8">
              <div className="field-label" style={{ marginBottom: 12 }}>Connect</div>
              <div className="row gap-3">
                <SocialBtn label="LinkedIn"><IconLinkedIn size={17} /></SocialBtn>
                <SocialBtn label="Twitter"><IconTwitter size={17} /></SocialBtn>
                <SocialBtn label="GitHub"><IconGitHub size={17} /></SocialBtn>
              </div>
            </div>
          </div>

          <Card data-reveal style={{ padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Client onboarding</h3>
            <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 22 }}>Tell us about your project. Our PM will reach out shortly.</p>
            <form onSubmit={submit} className="flex-col gap-4" noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="First name" error={errors.firstName}>
                  <Input value={form.firstName} onChange={set("firstName")} placeholder="Juan" autoComplete="given-name" />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <Input value={form.lastName} onChange={set("lastName")} placeholder="dela Cruz" autoComplete="family-name" />
                </Field>
              </div>
              <Field label="Work email" error={errors.email}>
                <Input type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" />
              </Field>
              <Field label="Company" error={errors.company}>
                <Input value={form.company} onChange={set("company")} placeholder="Your organization" autoComplete="organization" />
              </Field>
              <Field label="Contact number" helper="Optional — we'll reach out by email if blank">
                <Input value={form.phone} onChange={set("phone")} placeholder="+63 ___ ___ ____" autoComplete="tel" />
              </Field>
              <Field label="Inquiry details" error={errors.details}>
                <Textarea value={form.details} onChange={set("details")} rows={5} placeholder="What you want to build, current stack, timeline…" />
              </Field>
              <Button type="submit" variant="primary" size="lg" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
                {submitting ? "Submitting…" : "Send inquiry"}
              </Button>
              {errors.form && <div style={{ fontSize: 12.5, color: "#FCA5A5", textAlign: "center" }}>{errors.form}</div>}
              <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>By submitting you agree to our terms & privacy policy.</div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon, label, value, href }: { icon: ReactNode; label: string; value: ReactNode; href?: string }) {
  const inner = (
    <div className="row gap-4" style={{ alignItems: "flex-start" }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--border-soft)",
          color: "var(--text-2)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div className="field-label" style={{ fontSize: 12.5 }}>{label}</div>
        <div style={{ fontSize: 15, marginTop: 2, lineHeight: 1.5 }}>{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} style={{ display: "block" }}>
      {inner}
    </a>
  ) : (
    inner
  );
}

function SocialBtn({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button title={label} className="btn btn-secondary btn-sm" style={{ width: 38, height: 38, padding: 0 }}>
      {children}
    </button>
  );
}

/* ---------- Footer ---------- */
export function Footer({ onNavigate }: { onNavigate: NavigateFn }) {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Platform", route: "platform" },
        { label: "How it works", route: "how-it-works" },
        { label: "Pricing", route: "pricing" },
        { label: "Changelog", route: "resources/changelog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", route: "about" },
        { label: "Customers", route: "resources/customers" },
        { label: "Careers", route: "resources/careers" },
        { label: "Partners", route: "resources/partners" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", route: "resources/documentation" },
        { label: "API reference", route: "resources/api-reference" },
        { label: "Guides", route: "resources/guides" },
        { label: "Status", route: "resources/status" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms", route: "resources/terms-of-service" },
        { label: "Privacy", route: "resources/privacy-policy" },
        { label: "Security", route: "resources/security" },
        { label: "Cookies", route: "resources/cookies" },
      ],
    },
  ];
  const handleFooterLink = (route: string) => {
    if (route === "contact") onNavigate("home", "contact");
    else onNavigate(route);
  };
  return (
    <footer className="footer">
      <div className="container-wide">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, marginTop: 18, maxWidth: 280 }}>
              A Philippine boutique IT consultancy delivering enterprise software for MSMEs and mid-market companies — fast,
              transparent, and fully owned by you.
            </p>
            <div className="row gap-2 mt-6">
              <SocialBtn label="LinkedIn"><IconLinkedIn size={15} /></SocialBtn>
              <SocialBtn label="Twitter"><IconTwitter size={15} /></SocialBtn>
              <SocialBtn label="GitHub"><IconGitHub size={15} /></SocialBtn>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button type="button" className="footer-link" onClick={() => handleFooterLink(link.route)}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© 2026 Alphaexplora IT Services. All rights reserved.</div>
          <div className="row gap-4">
            <span className="row gap-2">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} /> All systems normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
