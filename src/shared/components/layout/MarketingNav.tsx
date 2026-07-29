"use client";

/**
 * MarketingNav — minimal top navigation for the marketing site.
 * Logo + 2 links + 1 CTA. No dropdowns, no mega-menus.
 *
 * Anchor links scroll through Lenis so they glide with the same easing as
 * wheel scroll. On secondary pages (no target in the DOM) the `/#hash` href
 * falls through to a normal navigation back to the landing page.
 */

import Link from "next/link";
import { useState, useEffect, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import "./MarketingNav.css";

const NAV_LINKS = [
  { hash: "#how-it-works", label: "How it works" },
  { hash: "#faq", label: "FAQ" },
];

const CINEMA_ANCHORS: Record<string, "how" | "faq"> = {
  "#how-it-works": "how",
  "#faq": "faq",
};

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchor = (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
    const target = document.querySelector(hash);
    if (!target) return; // not on the landing page — navigate to /#hash
    e.preventDefault();
    const cinema = document.querySelector('.marketing-cinema[data-cinema-mode="reel"]');
    const scene = CINEMA_ANCHORS[hash];
    if (cinema && scene) {
      window.dispatchEvent(new CustomEvent("marketing-cinema-scroll-to", { detail: { scene } }));
      return;
    }
    if (lenis) lenis.scrollTo(hash, { offset: -72 });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className={`mnav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mnav-inner">
        <Link href="/" className="mnav-logo">
          <span className="mnav-logo-mark">⌬</span>
          <span className="mnav-logo-word">devflow</span>
        </Link>

        <div className="mnav-links">
          {NAV_LINKS.map((link) => (
            <a
              key={link.hash}
              href={`/${link.hash}`}
              className="mnav-link"
              onClick={(e) => handleAnchor(e, link.hash)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="mnav-cta">
          <Link href="/sign-in" className="mnav-signin">Sign in</Link>
          <Link href="/sign-in" className="mnav-start">
            Start →
          </Link>
        </div>
      </div>
    </nav>
  );
}
