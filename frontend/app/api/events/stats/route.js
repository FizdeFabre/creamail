import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Vérification utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = user.id;

    // Récupérer les séquences de l'utilisateur
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
        variants: []
      }), { status: 200 });
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
    const totalOpened = sends.filter(e => e.opened).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;

    // Agrégations temporelles
    const perDayMap = {};
    const perMonthMap = {};
    for (const e of sends) {
      const d = new Date(e.sent_at);
      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      perDayMap[day] = (perDayMap[day] || 0) + 1;
      perMonthMap[month] = (perMonthMap[month] || 0) + 1;
    }

    const perDay = Object.entries(perDayMap).map(([date, count]) => ({ date, count }));
    const perMonth = Object.entries(perMonthMap).map(([date, count]) => ({ date, count }));

    // Résultats A/B
    const variantMap = {};
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
      openRate: stats.totalSent ? (stats.totalOpened / stats.totalSent) * 100 : 0
    }));

    return new Response(JSON.stringify({
      totalSent,
      totalOpened,
      openRate,
      perDay,
      perMonth,
      variants
    }), { status: 200 });

  } catch (err) {
    console.error("Erreur fetch emails_sent:", err);
    return new Response(JSON.stringify({ error: "Erreur fetch emails_sent" }), { status: 500 });
  }
}