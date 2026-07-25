import { redirect } from "next/navigation";

/**
 * Legacy per-persona login URL, kept only so existing bookmarks and any links
 * still pointing here land on the single /sign-in page instead of 404ing.
 * `next` is forwarded so an interrupted deep link still resumes after login.
 */
export default async function LegacyDevSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;
  redirect(target ? `/sign-in?next=${encodeURIComponent(target)}` : "/sign-in");
}
