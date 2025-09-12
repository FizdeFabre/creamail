import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("sequence_id");
  if (!id) return new Response("Missing id", { status: 400 });

  const { error } = await supabase
    .from("emails_sent")
    .update({ opened: true })
    .eq("sequence_id", id);

  if (error) return new Response("DB error", { status: 500 });

  // Pixel transparent 1x1
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwQACfsD/QkEZHcAAAAASUVORK5CYII=",
    "base64"
  );
  return new Response(pixel, { headers: { "Content-Type": "image/png" } });
}