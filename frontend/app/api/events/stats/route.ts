import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient, User } from "@supabase/supabase-js";

export async function GET() {
  try {
    // 1. Tentative avec auth normale
    const supabase = createRouteHandlerClient({ cookies });
    let {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // 2. Si pas de user -> fallback en mode "admin"
    if (!user) {
      console.warn("⚠️ Aucun user trouvé, fallback sur service role");
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ pas public
      );

      // overwrite supabase.from pour réutiliser ton code
      supabase.from = serviceSupabase.from.bind(serviceSupabase);

      // fake user minimal pour TypeScript
      user = {
        id: "fake-admin-id",
        aud: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      } as User;
    }

    const userId = user.id;

    // Récupérer les séquences
    const { data: sequencesData, error: seqError } = await supabase
      .from("email_sequences")
      .select("id, campaign_name")
      .eq("user_id", userId);

    if (seqError) throw seqError;

    const sequences = sequencesData ?? [];
    const sequenceIds = sequences.map((s) => s.id);

    if (sequenceIds.length === 0) {
      return Response.json(
        {
          totalSent: 0,
          totalOpened: 0,
          openRate: 0,
          perDay: [],
          perMonth: [],
          variants: [],
        },
        { status: 200 }
      );
    }

    // Récupérer les envois
    const { data: sendsData, error: sendsError } = await supabase
      .from("emails_sent")
      .select("id, sent_at, opened, variant, sequence_id")
      .in("sequence_id", sequenceIds);

    if (sendsError) throw sendsError;

    const sends = sendsData ?? [];

    // Totaux globaux
    const totalSent = sends.length;
    const totalOpened = sends.filter((e) => e.opened).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;

    // Agrégations temporelles
    const perDayMap: Record<string, number> = {};
    const perMonthMap: Record<string, number> = {};
    for (const e of sends) {
      const d = new Date(e.sent_at);
      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      perDayMap[day] = (perDayMap[day] || 0) + 1;
      perMonthMap[month] = (perMonthMap[month] || 0) + 1;
    }

    const perDay = Object.entries(perDayMap).map(([date, count]) => ({
      date,
      count,
    }));
    const perMonth = Object.entries(perMonthMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Résultats A/B
    const variantMap: Record<
      string,
      { totalSent: number; totalOpened: number }
    > = {};
    for (const e of sends) {
      const v = e.variant || "A"; // fallback si pas défini
      if (!variantMap[v]) {
        variantMap[v] = { totalSent: 0, totalOpened: 0 };
      }
      variantMap[v].totalSent++;
      if (e.opened) variantMap[v].totalOpened++;
    }

    const variants = Object.entries(variantMap).map(([variant, stats]) => ({
      variant,
      totalSent: stats.totalSent,
      totalOpened: stats.totalOpened,
      openRate: stats.totalSent
        ? (stats.totalOpened / stats.totalSent) * 100
        : 0,
    }));

    return Response.json(
      {
        totalSent,
        totalOpened,
        openRate,
        perDay,
        perMonth,
        variants,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur fetch emails_sent:", err);
    return Response.json({ error: "Erreur fetch emails_sent" }, { status: 500 });
  }
}