import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Debug cookies écrits
  console.log("🔍 Middleware sees session:", session ? session.user?.id : null);

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/sequences/:path*"],
};