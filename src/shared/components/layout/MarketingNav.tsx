"use client";

/**
 * MarketingNav — minimal top navigation for the marketing site.
 * Logo + 2 links + 1 CTA. No dropdowns, no mega-menus.
 */

import Link from "next/link";
import { useState, useEffect } from "react";
import "./MarketingNav.css";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`mnav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mnav-inner">
        <Link href="/" className="mnav-logo">
          <span className="mnav-logo-mark">⌬</span>
          <span className="mnav-logo-word">devflow</span>
        </Link>

        <div className="mnav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mnav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="mnav-cta">
          <a href="/sign-in" className="mnav-signin">Sign in</a>
          <a href="#cta" className="mnav-start">Start →</a>
        </div>
      </div>
    </nav>
  );
}
