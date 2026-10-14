import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Public routes are excluded in matcher or handled early
    if (pathname.startsWith("/verify") || pathname.startsWith("/api/verify")) {
      return NextResponse.next();
    }

    const userRole = token?.role as string | undefined;

    // CA Console guard
    if (pathname.startsWith("/ca")) {
      if (userRole !== "CA-reviewer" && userRole !== "PlatformAdmin") {
        const portalUrl = new URL("/portal", req.url);
        portalUrl.searchParams.set("error", "unauthorized_ca_access");
        return NextResponse.redirect(portalUrl);
      }
    }

    // Client Portal guard
    if (pathname.startsWith("/portal")) {
      const allowedClientRoles = ["Owner", "FinanceManager", "Accountant", "PlatformAdmin"];
      if (userRole && !allowedClientRoles.includes(userRole)) {
        if (userRole === "CA-reviewer") {
          return NextResponse.redirect(new URL("/ca", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Public verification paths do not require login
        if (pathname.startsWith("/verify") || pathname.startsWith("/api/verify")) {
          return true;
        }
        // Protected paths require a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/portal/:path*",
    "/ca/:path*",
    // Exclude static assets, api/auth, and public verify routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth|verify).*)",
  ],
};
