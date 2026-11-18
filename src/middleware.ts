import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeRedirectPath } from "./lib/auth-next";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("finance_token")?.value;
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  // El enlace de restablecimiento se abre a menudo desde el propio navegador
  // donde ya hay sesión: redirigir al dashboard rompería el flujo.
  const accessibleWhenLoggedIn = ["/reset-password"];
  const isPublicPath = publicPaths.includes(pathname);
  const isApiPath = pathname.startsWith("/api/");
  const isStaticPath = pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  if (isApiPath || isStaticPath) {
    return NextResponse.next();
  }

  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    const next = safeRedirectPath(`${pathname}${search}`);
    if (next) loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicPath && !accessibleWhenLoggedIn.includes(pathname)) {
    const requested = safeRedirectPath(new URLSearchParams(search).get("next"));
    return NextResponse.redirect(new URL(requested ?? "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
