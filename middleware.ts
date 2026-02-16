import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "./lib/api-base-url";

type UserRole = "Candidat" | "Système" | "Admin" | "Commission" | "Président";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

const API_BASE_URL = getApiBaseUrl();

const roleByRoute: Record<string, UserRole> = {
  "/candidat": "Candidat",
  "/systeme": "Système",
  "/admin": "Admin",
  "/commission": "Commission",
  "/president": "Président",
};

const redirectByRole: Record<UserRole, string> = {
  Candidat: "/candidat",
  "Système": "/systeme",
  Admin: "/admin",
  Commission: "/commission",
  "Président": "/president",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleRoutes = Object.keys(roleByRoute);
  const matchedRoute = roleRoutes.find((route) => pathname.startsWith(route));
  const isLoginRoute = pathname.startsWith("/login");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isRootRoute = pathname === "/";
  const isLandingRoute = pathname.startsWith("/landing");

  // Public routes: allow access without auth.
  // The landing page is the default route.
  if (isRootRoute || isLandingRoute || isLoginRoute) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const data = (await response.json()) as { user: AuthUser };
    const user = data.user;
    const userTarget = user ? redirectByRole[user.role] ?? "/login" : "/login";

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (matchedRoute) {
      const expectedRole = roleByRoute[matchedRoute];

      if (user.role !== expectedRole) {
        return NextResponse.redirect(new URL(userTarget, request.url));
      }

      return NextResponse.next();
    }

    if (isDashboardRoute) {
      return NextResponse.redirect(new URL(userTarget, request.url));
    }

    return NextResponse.next();
  } catch {
    // If the backend is down/unreachable, don't redirect-loop on /login.
    if (isLoginRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/candidat/:path*",
    "/systeme/:path*",
    "/admin/:path*",
    "/commission/:path*",
    "/president/:path*",
  ],
};
