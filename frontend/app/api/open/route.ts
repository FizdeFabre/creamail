import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("email_id");

    if (!emailId) {
      return new NextResponse("Missing email_id", { status: 400 });
    }

    // Update la DB
    await supabase
      .from("emails_sent")
      .update({ opened: true, opened_at: new Date().toISOString() })
      .eq("id", emailId);

    // Retourne une image 1x1 transparente
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+VSk8AAAAASUVORK5CYII=",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": pixel.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Pixel error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}