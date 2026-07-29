"use client";

/**
 * MarketingHomeView - cinematic landing page.
 * The home surface is directed by one scroll-scrubbed reel.
 */

import { MarketingCinema } from "../components/MarketingCinema";
import { MarketingNav } from "@/shared/components/layout/MarketingNav";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";

export function MarketingHomeView() {
  return (
    <>
      <MarketingNav />
      <main data-screen-label="01 Landing">
        <MarketingCinema />
      </main>
      <MarketingFooter />
    </>
  );
}
