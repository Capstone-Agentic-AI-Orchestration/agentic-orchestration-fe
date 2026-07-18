/**
 * MarketingNav - minimal top navigation for the marketing site.
 * Logo + 1 link + 1 CTA. No dropdowns, no mega-menus.
 */

import Link from "next/link";
import Image from "next/image";
import "./MarketingNav.css";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How we work" },
];

export function MarketingNav() {
  return (
    <nav className="mnav">
      <div className="mnav-inner">
        <Link href="/" className="mnav-logo" aria-label="Alphaexplora home">
          <Image
            src="/assets/alpha-logo-full.png"
            alt="Alphaexplora"
            width={132}
            height={44}
            className="mnav-logo-img"
            priority
          />
        </Link>

        <div className="mnav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mnav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="mnav-cta">
          <Link href="/client/sign-in" className="mnav-signin">Sign in</Link>
          <a href="#cta" className="mnav-start">Start a project</a>
        </div>
      </div>
    </nav>
  );
}
