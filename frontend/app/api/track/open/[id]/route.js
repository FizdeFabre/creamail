// app/api/track/open/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;

    if (!emailId) {
      return new NextResponse("Missing ID", { status: 400 });
    }

    // Mise à jour : opened = true
    const { error } = await supabaseAdmin
      .from("emails_sent")
      .update({ opened: true })
      .eq("id", emailId);

    if (error) {
      console.error("Supabase update error:", error);
    }

    // Pixel transparent 1x1 en base64
    const pixel = Buffer.from(
      "R0lGODlhAQABAPAAAP///wAAACwAAAAAAQABAAACAkQBADs=",
      "base64"
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": pixel.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Open pixel error:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}