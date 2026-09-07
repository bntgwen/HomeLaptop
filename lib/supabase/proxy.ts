import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

  // Hanya periksa sesi jika mengakses rute yang dilindungi (/dashboard, /protected, /auth/login, /auth/sign-up)
  const isProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/protected");
  const isAuthPath = pathname === "/auth/login" || pathname === "/auth/sign-up";

  if (!isProtectedPath && !isAuthPath) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Proteksi Rute /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const role = (user.user_metadata?.role as string) || "admin";
    if (role === "konsumen" || role === "pelanggan") {
      const url = request.nextUrl.clone();
      url.pathname = "/tracking";
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect jika sudah login
  if (user && isAuthPath) {
    const role = (user.user_metadata?.role as string) || "admin";
    const url = request.nextUrl.clone();
    url.pathname = (role === "admin" || role === "teknisi") ? "/dashboard" : "/tracking";
    return NextResponse.redirect(url);
  }

  // 3. Proteksi umum rute /protected
  if (pathname.startsWith("/protected") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
