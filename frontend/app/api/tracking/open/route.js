import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// On crée un client Supabase côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Service Role Key (pas la clé publique)
);

export async function GET(req) {
  try {
    // On récupère l’ID du mail dans l’URL
    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("id");

    if (!emailId) { 
      return NextResponse.json({ error: "Missing email ID" }, { status: 400 });
    }

    // On update la ligne correspondante
    await supabase
      .from("emails_sent")
      .update({ opened: true, opened_at: new Date().toISOString() })
      .eq("id", emailId);

    // On renvoie un pixel transparent (image PNG 1x1)
    const img = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAuMB9tHZdUQAAAAASUVORK5CYII=",
      "base64"
    );

    return new NextResponse(img, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": img.length,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Expires": "0",
        "Pragma": "no-cache",
      },
    });
  } catch (err) {
    console.error("Erreur tracking pixel:", err);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}