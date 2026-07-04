"use client";

/**
 * MarketingHomeView — landing page v2.
 * Five sections: Hero → AnatomyOfRun → HowItWorks → FAQ → CTASection
 * Black, minimal, technical. No decorations.
 */

import { Hero } from "../components/Hero";
import { AnatomyOfRun } from "../components/AnatomyOfRun";
import { HowItWorks } from "../components/HowItWorks";
import { FAQ } from "../components/FAQ";
import { CTASection } from "../components/CTASection";
import { MarketingNav } from "@/shared/components/layout/MarketingNav";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";

export function MarketingHomeView() {
  return (
    <>
      <MarketingNav />
      <main data-screen-label="01 Landing">
        <Hero />
        <AnatomyOfRun />
        <HowItWorks />
        <FAQ />
        <CTASection />
      </main>
      <MarketingFooter />
    </>
  );
}
