import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("finance_token")?.value;
  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.includes(pathname);

  // Mock mode: always allow through (AuthContext handles auto-login)
  if (!token && !isPublicPath && pathname !== "/" && pathname !== "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
