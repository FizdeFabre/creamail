import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const body = await req.json();
  const { emailId, userId, extra } = body;

  if (!emailId || !userId) {
    return NextResponse.json({ error: "Missing emailId or userId" }, { status: 400 });
  }

  await supabase.from("email_events").insert({
    email_id: emailId,
    user_id: userId,
    event_type: "responded",
    metadata: extra || {}
  });

  return NextResponse.json({ success: true });
}