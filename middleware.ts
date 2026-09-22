import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes a locked-into-changing-password user must still be able to reach:
// the change-password page itself, and the auth API (so sign-out works).
const ALLOWED_PATHS = ["/change-password", "/api/auth", "/api/change-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token?.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets and Next's own internals —
  // this needs to catch every page/route the person could otherwise use.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.jpeg).*)"],
};
