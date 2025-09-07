import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const emailId = searchParams.get("emailId");
  const userId = searchParams.get("userId");

  if (emailId && userId) {
    await supabase.from("email_events").insert({
      email_id: emailId,
      user_id: userId,
      event_type: "opened",
      metadata: { ua: req.headers.get("user-agent") }
    });
  }

  // Pixel 1x1 transparent
  const pixel = Buffer.from(
    "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
    "base64"
  );
  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    }
  });
}