  import { NextResponse } from "next/server";
  import type { NextRequest } from "next/server";
  import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

  export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 🔐 Routes protégées
    const protectedRoutes = ["/dashboard", "/billing", "/sequences"];
    if (protectedRoutes.some((path) => req.nextUrl.pathname.startsWith(path))) {
      if (!session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/login";
        return NextResponse.redirect(redirectUrl);
      }
    }

    return res;
  }

  export const config = {
    matcher: [
      "/dashboard/:path*",
      "/billing/:path*",
      "/sequences/:path*",
    ],
  };