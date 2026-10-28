import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/types";

const PUBLIC_PATHS = ["/login"];

const ROLE_REDIRECT: Record<Role, string> = {
  operations_director: "/dashboard",
  technician: "/technician",
  household: "/",
};

// Which path prefixes each role may access
const ROLE_ALLOWED: Record<Role, string[]> = {
  operations_director: [
    "/dashboard",
    "/technician",
    "/billing",
    "/reports",
    "/operations",
    "/check-in",
    "/meter-reading",
    "/api",
  ],
  technician: [
    "/technician",
    "/check-in",
    "/meter-reading",
    "/dashboard",
    "/operations",
    "/api",
  ],
  household: ["/billing", "/api"],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in on login page → redirect by role
  if (user && isPublic) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    const role = (profile?.role as Role) ?? "household";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_REDIRECT[role];
    return NextResponse.redirect(url);
  }

  // Logged in: enforce role-based access control
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    const role = (profile?.role as Role) ?? "household";
    const allowed = ROLE_ALLOWED[role] ?? [];
    const canAccess = allowed.some((p) => pathname.startsWith(p));
    if (!canAccess) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_REDIRECT[role];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
