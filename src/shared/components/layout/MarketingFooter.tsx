"use client";

/**
 * MarketingFooter - minimal footer.
 * 3 columns: brand + product + legal.
 */

import Image from "next/image";
import "./MarketingFooter.css";

export function MarketingFooter() {
  return (
    <footer className="mfoot">
      <div className="mfoot-inner">
        <div className="mfoot-brand">
          <Image
            src="/assets/alpha-logo-full.png"
            alt="Alphaexplora"
            width={150}
            height={50}
            className="mfoot-logo-img"
          />
          <p className="mfoot-tagline">
            Architecting the digital frontier.
          </p>
        </div>

        <div className="mfoot-cols">
          <div className="mfoot-col">
            <h4>Studio</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#how-it-works">How we work</a></li>
              <li><a href="#cta">Start a project</a></li>
            </ul>
          </div>

          <div className="mfoot-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@alphaexplora.com">hello@alphaexplora.com</a></li>
              <li><a href="https://alphaexplora.com" target="_blank" rel="noopener noreferrer">alphaexplora.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mfoot-bottom">
          <span>© {new Date().getFullYear()} Alphaexplora</span>
          <span className="mfoot-meta">Enterprise software · Philippines</span>
        </div>
      </div>
    </footer>
  );
}
