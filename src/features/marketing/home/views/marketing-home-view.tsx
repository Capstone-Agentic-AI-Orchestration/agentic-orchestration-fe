"use client";

/**
 * MarketingHomeView - landing page v3.
 * Four focused sections: hero, live run, process, start.
 */

import { Hero } from "../components/Hero";
import { AnatomyOfRun } from "../components/AnatomyOfRun";
import { HowItWorks } from "../components/HowItWorks";
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
        <CTASection />
      </main>
      <MarketingFooter />
    </>
  );
}
