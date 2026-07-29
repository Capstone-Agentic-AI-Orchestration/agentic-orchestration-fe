import type { Metadata } from "next";
import { MarketingHomeView } from "@/features/marketing/home/views/marketing-home-view";
import { MarketingFrame } from "@/features/marketing/loading/MarketingFrame";

export const metadata: Metadata = {
  title: "DevFlow — One prompt, build everything",
  description:
    "An Eve-powered multi-agent system for planning, building, reviewing, and shipping production software.",
};

export default function MarketingHomePage() {
  return (
    <MarketingFrame>
      <MarketingHomeView />
    </MarketingFrame>
  );
}
