import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("finance_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Public paths
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.includes(pathname);

  // If user is authenticated and tries to access login/register, redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and tries to access protected paths, redirect to login
  if (!token && !isPublicPath && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
