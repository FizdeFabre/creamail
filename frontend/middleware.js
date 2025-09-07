import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export function middleware(req) {
  // NextResponse.next() permet de continuer le flux
  const res = NextResponse.next();

  // On crée le client Supabase côté middleware (utile pour debug)
  const supabase = createMiddlewareClient({ req, res });

  // ⚠️ Middleware ne fait pas de redirect ici
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("🔍 Session middleware:", session);
  })();

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/sequences/:path*"],
};