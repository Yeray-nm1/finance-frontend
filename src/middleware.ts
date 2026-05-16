import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("finance_token")?.value;
  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.includes(pathname);
  const isApiPath = pathname.startsWith("/api/");
  const isStaticPath = pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  if (isApiPath || isStaticPath) {
    return NextResponse.next();
  }

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
