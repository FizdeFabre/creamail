// /api/track/click.ts
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const emailId = url.searchParams.get("emailId");
  const target = url.searchParams.get("url");

  if (emailId && target) {
    // Marque le clic dans Supabase
    await supabase
      .from("emails_sent")
      .update({ clicked: true, clicked_at: new Date().toISOString() })
      .eq("id", emailId);

    // Redirige vers le lien réel
    return new Response(null, {
      status: 302,
      headers: { Location: target },
    });
  }
  return new Response("Invalid request", { status: 400 });
}