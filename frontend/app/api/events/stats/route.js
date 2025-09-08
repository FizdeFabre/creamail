// app/api/events/stats/route.js
import { cookies, headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    // createRouteHandlerClient lit les cookies du request (Next App Router)
    const supabase = createRouteHandlerClient({ cookies });

    // debug raw headers & cookies
    const rawHeaders = Object.fromEntries(headers().entries());
    const rawCookies = cookies().getAll().map(c => ({ name: c.name, value: c.value }));

    // attempt to read session/user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log("API DEBUG - headers (sample):", {
      host: rawHeaders.host,
      referer: rawHeaders.referer,
      cookie_header_present: !!rawHeaders.cookie
    });
    console.log("API DEBUG - cookies (names):", rawCookies.map(c => c.name));
    console.log("API DEBUG - user:", user ? user.id : null, "userError:", userError ?? null);
    console.log("API DEBUG - session:", session ? { user_id: session.user?.id, expires_at: session.expires_at } : null, "sessionError:", sessionError ?? null);

    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Unauthorized",
        debug: { headers: { host: rawHeaders.host, cookie_present: !!rawHeaders.cookie }, cookies: rawCookies }
      }), { status: 401 });
    }

    const userId = user.id;

    // --- real stats logic below (unchanged) ---
    const { data: sequencesData, error: seqError } = await supabase
      .from("email_sequences")
      .select("id, campaign_name")
      .eq("user_id", userId);

    if (seqError) throw seqError;

    const sequences = sequencesData ?? [];
    const sequenceIds = sequences.map(s => s.id);

    if (sequenceIds.length === 0) {
      return new Response(JSON.stringify({
        totalSent: 0,
        totalOpened: 0,
        openRate: 0,
        perDay: [],
        perMonth: [],
        variants: [],
        debug: { headers: rawHeaders, cookies: rawCookies }
      }), { status: 200 });
    }

    const { data: sendsData, error: sendsError } = await supabase
      .from("emails_sent")
      .select("id, sent_at, opened, variant, sequence_id")
      .in("sequence_id", sequenceIds);

    if (sendsError) throw sendsError;
    const sends = sendsData ?? [];

    // compute stats + A/B
    const totalSent = sends.length;
    const totalOpened = sends.filter(e => e.opened).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;

    const perDayMap = {};
    const perMonthMap = {};
    sends.forEach(e => {
      if (!e.sent_at) return;
      const d = new Date(e.sent_at);
      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      perDayMap[day] = (perDayMap[day] || 0) + 1;
      perMonthMap[month] = (perMonthMap[month] || 0) + 1;
    });
    const perDay = Object.entries(perDayMap).map(([date, count]) => ({ date, count }));
    const perMonth = Object.entries(perMonthMap).map(([date, count]) => ({ date, count }));

    const variantMap = {};
    for (const e of sends) {
      const v = e.variant || "A";
      if (!variantMap[v]) variantMap[v] = { totalSent: 0, totalOpened: 0 };
      variantMap[v].totalSent++;
      if (e.opened) variantMap[v].totalOpened++;
    }
    const variants = Object.entries(variantMap).map(([variant, s]) => ({
      variant,
      totalSent: s.totalSent,
      totalOpened: s.totalOpened,
      openRate: s.totalSent ? (s.totalOpened / s.totalSent) * 100 : 0
    }));

    return new Response(JSON.stringify({
      totalSent,
      totalOpened,
      openRate,
      perDay,
      perMonth,
      variants,
      debug: { headers: rawHeaders, cookies: rawCookies }
    }), { status: 200 });

  } catch (err) {
    console.error("API DEBUG - error:", err);
    return new Response(JSON.stringify({ error: "Erreur fetch emails_sent", detail: String(err) }), { status: 500 });
  }
}
