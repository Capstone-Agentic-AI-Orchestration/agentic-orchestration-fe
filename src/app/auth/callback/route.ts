import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    const url = new URL("/sign-in", request.nextUrl);
    url.searchParams.set("next", next);
    url.searchParams.set("error", "oauth_failed");
    const response = NextResponse.redirect(url);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const redirectUrl = new URL("/sign-in", request.nextUrl);
  redirectUrl.searchParams.set("next", next);
  if (error) {
    redirectUrl.searchParams.set("error", "oauth_failed");
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);
  redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (error) {
    return redirectResponse;
  }

  // Persist the session cookies set by exchangeCodeForSession
  response.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });

  return redirectResponse;
}
