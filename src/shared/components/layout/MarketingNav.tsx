/**
 * MarketingNav - minimal top navigation for the marketing site.
 * Logo + 1 link + 1 CTA. No dropdowns, no mega-menus.
 */

import Link from "next/link";
import "./MarketingNav.css";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
];

export function MarketingNav() {
  return (
    <nav className="mnav">
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
          <a href="#cta" className="mnav-start">Start</a>
        </div>
      </div>
    </nav>
  );
}
