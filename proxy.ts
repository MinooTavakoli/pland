import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth/jwt";

/**
 * Proxy guards admin and customer *pages* (redirect to login for UX).
 * All API authentication/authorization is enforced inside each route handler
 * via requireUser / requireAdmin / requireAuth, which is authoritative and
 * supports role-aware access (e.g. admins reading any order).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get("admin-auth")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Customer-only pages
  if (pathname.startsWith("/checkout") || pathname.startsWith("/profile")) {
    const token = req.cookies.get("site-auth")?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== "USER") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/profile/:path*"],
};
