import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge auth gate for the private internal console (DevFlow).
 *
 * This runs before any page renders, so unauthenticated visitors never receive
 * the internal console JS/HTML. It enforces *authentication* only — fine-grained
 * role routing (DEV vs PM vs ADMIN) stays with <RequireAuth> in each layout and,
 * authoritatively, with the backend's per-route RolesGuard. The whole console is
 * also marked noindex so it can never surface in search engines.
 */

// Reachable without a session (the login surfaces themselves).
const PUBLIC_PATHS = ["/sign-in", "/dev/sign-in", "/pm/sign-in"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  // The internal console must never be indexed, on any route.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return response;

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

  // getUser() validates the JWT with Supabase (and refreshes it), unlike getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    // A fresh response does not inherit headers set above, so re-stamp noindex:
    // every console response, including redirects, must stay unindexable.
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }

  return response;
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|images|templates|uploads|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
