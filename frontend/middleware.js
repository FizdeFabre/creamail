// middleware.js
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export function middleware(req) {
  const res = NextResponse.next();

  // Log synchrones possibles
  try {
    console.log("---- MIDDLEWARE DEBUG ----");
    console.log("req.nextUrl:", req.nextUrl.href);
    console.log("Request headers (sample):", {
      host: req.headers.get("host"),
      referer: req.headers.get("referer"),
      origin: req.headers.get("origin"),
      cookie: req.headers.get("cookie")?.slice(0, 200) ?? null // tronque pour lisibilité
    });
  } catch (e) {
    console.error("MW sync log error", e);
  }

  // Instancier supabase middleware client (pour debug async seulement)
  const supabase = createMiddlewareClient({ req, res });

  (async () => {
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      console.log("MW async - supabase session:", session ? { user: session.user?.id, expires_at: session.expires_at } : null, "err:", sessionErr ?? null);
    } catch (err) {
      console.error("MW async - error getting session:", err);
    }
  })();

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/sequences/:path*"],
};