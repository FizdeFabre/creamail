import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const emailId = searchParams.get("emailId");
  const userId = searchParams.get("userId");
  const targetUrl = searchParams.get("url");

  if (emailId && userId && targetUrl) {
    await supabase.from("email_events").insert({
      email_id: emailId,
      user_id: userId,
      event_type: "clicked",
      metadata: { url: targetUrl }
    });

    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.json({ error: "Missing params" }, { status: 400 });
}