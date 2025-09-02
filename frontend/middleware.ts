import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Crée un client Supabase lié au contexte de la requête
  const supabase = createMiddlewareClient({ req, res });

  // Récupère la session utilisateur
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Pages à protéger
  const protectedRoutes = ["/dashboard", "/billing", "/sequences"];

  if (protectedRoutes.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      // pas de session ? On renvoie vers /login
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

// Active le middleware pour TOUTES les routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};