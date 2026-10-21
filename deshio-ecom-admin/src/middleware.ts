import { NextRequest, NextResponse } from "next/server";

// Public paths that don't need authentication
const PUBLIC_PATHS = ["/signin", "/forbidden"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check for admin token cookie
  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
