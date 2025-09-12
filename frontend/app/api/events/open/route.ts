import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  // 1. Mettre à jour l’email
  const { error } = await supabaseAdmin
    .from("emails_sent")
    .update({ opened: true })
    .eq("id", id);

  if (error) {
    console.error("❌ Update error:", error.message);
    return new Response("DB error", { status: 500 });
  }

  // 2. Retourner un pixel 1x1
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwQACfsD/QkEZHcAAAAASUVORK5CYII=",
    "base64"
  );
  return new Response(pixel, {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}