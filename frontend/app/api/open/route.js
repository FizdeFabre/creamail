import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  try {
    // Met à jour le champ "opened"
    const { error } = await supabase
      .from("emails_sent")
      .update({ opened: true })
      .eq("id", id);

    if (error) {
      console.error("❌ DB error:", error.message);
      return new Response("DB error", { status: 500 });
    }

    // Retourner un pixel transparent
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwQACfsD/QkEZHcAAAAASUVORK5CYII=",
      "base64"
    );

    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (e) {
    console.error("❌ Pixel route error:", e);
    return new Response("Server error", { status: 500 });
  }
}