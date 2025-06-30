// app/api/responses/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const { data, error } = await supabase
        .from("email_responses")
        .select("response_text");

    if (error) {
        console.error("Erreur Supabase :", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responses = data.map((item) => item.response_text);
    return NextResponse.json({ responses });
}