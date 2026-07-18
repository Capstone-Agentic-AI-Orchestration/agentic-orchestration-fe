"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

/**
 * Browser Supabase client with cookie-backed sessions (via @supabase/ssr).
 *
 * Cookie storage (instead of the default localStorage) is what lets the edge
 * `middleware.ts` read the session and gate routes before any page JS loads.
 * The `.auth` / `.from` API surface is identical to `createClient`, so the rest
 * of the app is unchanged. Token refresh and OAuth `detectSessionInUrl` are on
 * by default.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
