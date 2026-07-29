"use client";

/**
 * MarketingFooter — minimal footer.
 * 3 columns: brand + product + legal.
 */

import Link from "next/link";
import "./MarketingFooter.css";

export function MarketingFooter() {
  return (
    <footer className="mfoot">
      <div className="mfoot-inner">
        <div className="mfoot-brand">
          <span className="mfoot-logo">devflow</span>
          <p className="mfoot-tagline">
            One prompt. Build everything.
          </p>
        </div>

        <div className="mfoot-cols">
          <div className="mfoot-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><Link href="/sign-in">Get started</Link></li>
            </ul>
          </div>

          <div className="mfoot-col">
            <h4>Company</h4>
            <ul>
              <li><a href="https://alphaexplora.com" target="_blank" rel="noopener noreferrer">Alphaexplora</a></li>
              <li><a href="mailto:hello@alphaexplora.com">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mfoot-bottom">
          <span>© {new Date().getFullYear()} Alphaexplora</span>
          <span className="mfoot-meta">Built with Eve</span>
        </div>
      </div>
    </footer>
  );
}
