"use client";

/**
 * Marketing layout — wraps all marketing pages with the marketing frame
 * (loading screen + scroll lock + smooth scroll).
 */

import type { ReactNode } from "react";
import { MarketingFrame } from "@/features/marketing/loading/MarketingFrame";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingFrame>{children}</MarketingFrame>;
}
