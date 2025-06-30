// app/api/stats/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const { data: totalData, error: emailError } = await supabase
        .from("emails_sent")
        .select("id, opened, sent_at");

    if (emailError) {
        return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    const totalSent = totalData.length;
    const totalOpened = totalData.filter((d) => d.opened).length;

    // Ajout : on récupère les réponses
    const { data: responses, error: responseError } = await supabase
        .from("email_responses")
        .select("response_text");

    if (responseError) {
        return NextResponse.json({ error: responseError.message }, { status: 500 });
    }

    const totalResponded = responses.length;

    const countPerDay: Record<string, number> = {};
    totalData.forEach((entry) => {
        const date = new Date(entry.sent_at).toISOString().split("T")[0];
        countPerDay[date] = (countPerDay[date] || 0) + 1;
    });

    const perDay = Object.entries(countPerDay).map(([date, count]) => ({
        date,
        count,
    }));

    return NextResponse.json({
        totalSent,
        totalOpened,
        totalResponded,
        openRate: totalSent ? Math.round((totalOpened / totalSent) * 100) : 0,
        responseRate: totalSent ? Math.round((totalResponded / totalSent) * 100) : 0,
        perDay,
    });
}