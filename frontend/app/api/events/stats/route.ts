import { createClient } from "@supabase/supabase-js";

// === Supabase Admin Client ===
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// === Supabase Client "anon" pour valider JWT ===
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// === Types ===
interface Send {
  id: string;
  sent_at: string | null;
  opened: boolean;
  clicked: boolean;
  responded: boolean;
  variant: string | null;
  sequence_id: string;
}

interface Variant {
  variant: string;
  totalSent: number;
  totalOpened: number;
  totalResponded: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  isWinner?: boolean;
}

interface Sequence {
  id: string;
  campaign_name: string;
}

// === Route Handler ===
export async function GET(request: Request) {
  try {
    // --- 1. Récupération utilisateur via JWT ---
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized - no token" }), { status: 401 });

    // 🔑 Vérif utilisateur avec le client "anon"
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), { status: 401 });
    }

    const userId = user.id;

    // --- 2. Récupérer les séquences de l'utilisateur ---
    const { data: sequencesRaw, error: seqError } = await supabaseAdmin
      .from("email_sequences")
      .select("id, campaign_name")
      .eq("user_id", userId);

    if (seqError) throw new Error(seqError.message);

    const sequences: Sequence[] = sequencesRaw ?? [];
    const sequenceIds = sequences.map(s => s.id);

    if (!sequenceIds.length) {
      return new Response(JSON.stringify({
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalResponded: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0,
        perDay: [],
        perMonth: [],
        perHour: [],
        variants: [],
        bestCampaign: null,
        worstCampaign: null,
        summary: "Aucune campagne trouvée pour cet utilisateur."
      }), { status: 200 });
    }

    // --- 3. Récupérer tous les emails envoyés ---
    const { data: sendsRaw, error: sendsError } = await supabaseAdmin
      .from("emails_sent")
      .select("id, sent_at, opened, clicked, responded, variant, sequence_id")
      .in("sequence_id", sequenceIds);

    if (sendsError) throw new Error(sendsError.message);

    const sends: Send[] = sendsRaw ?? [];

    // --- 4. Calcul métriques globales ---
    const totalSent = sends.length;
    const totalOpened = sends.filter(e => e.opened).length;
    const totalClicked = sends.filter(e => e.clicked).length;
    const totalResponded = sends.filter(e => e.responded).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent ? (totalClicked / totalSent) * 100 : 0;
    const responseRate = totalSent ? (totalResponded / totalSent) * 100 : 0;

    // --- 5. perDay, perMonth, perHour ---
    const perDayMap: Record<string, number> = {};
    const perMonthMap: Record<string, number> = {};
    const perHourMap: Record<string, number> = {};

    sends.forEach(e => {
      if (!e.sent_at) return;
      const d = new Date(e.sent_at);
      if (isNaN(d.getTime())) return;

      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const hour = `${day} ${d.getUTCHours()}:00`;

      perDayMap[day] = (perDayMap[day] || 0) + 1;
      perMonthMap[month] = (perMonthMap[month] || 0) + 1;
      perHourMap[hour] = (perHourMap[hour] || 0) + 1;
    });

    const perDay = Object.entries(perDayMap).map(([date, count]) => ({ date, count }));
    const perMonth = Object.entries(perMonthMap).map(([date, count]) => ({ date, count }));
    const perHour = Object.entries(perHourMap).map(([hour, count]) => ({ hour, count }));

    // --- 6. Variants A/B ---
    const variantMap: Record<string, { totalSent: number; totalOpened: number; totalClicked: number; totalResponded: number }> = {};
    sends.forEach(e => {
      const v = e.variant || "A";
      if (!variantMap[v]) variantMap[v] = { totalSent: 0, totalOpened: 0, totalClicked: 0, totalResponded: 0 };
      variantMap[v].totalSent++;
      if (e.opened) variantMap[v].totalOpened++;
      if (e.clicked) variantMap[v].totalClicked++;
      if (e.responded) variantMap[v].totalResponded++;
    });

    const variants: Variant[] = Object.entries(variantMap).map(([variant, stats]) => ({
      variant,
      ...stats,
      openRate: stats.totalSent ? (stats.totalOpened / stats.totalSent) * 100 : 0,
      clickRate: stats.totalSent ? (stats.totalClicked / stats.totalSent) * 100 : 0,
      responseRate: stats.totalSent ? (stats.totalResponded / stats.totalSent) * 100 : 0,
    }));

    const winnerRate = Math.max(...variants.map(v => v.openRate));
    variants.forEach(v => v.isWinner = v.openRate === winnerRate);

    // --- 7. Best / Worst Campaign ---
    let bestCampaign: { campaign: string; rate: number } | null = null;
    let worstCampaign: { campaign: string; rate: number } | null = null;

    sequences.forEach(seq => {
      const seqSends = sends.filter(e => e.sequence_id === seq.id);
      const opened = seqSends.filter(e => e.opened).length;
      const sent = seqSends.length;
      const rate = sent ? (opened / sent) * 100 : 0;

      if (!bestCampaign || rate > bestCampaign.rate) bestCampaign = { campaign: seq.campaign_name, rate };
      if (!worstCampaign || rate < worstCampaign.rate) worstCampaign = { campaign: seq.campaign_name, rate };
    });

    // --- 8. Résumé narratif ---
    const bestDay = perDay.sort((a,b) => b.count - a.count)[0];
    const summary = bestDay
      ? `Ton meilleur jour est le ${bestDay.date} avec ${bestDay.count} ouvertures.`
      : "Pas assez de données pour générer un résumé.";

    // --- 9. Réponse API ---
    return new Response(JSON.stringify({
      totalSent,
      totalOpened,
      totalClicked,
      totalResponded,
      openRate,
      clickRate,
      responseRate,
      perDay,
      perMonth,
      perHour,
      variants,
      bestCampaign,
      worstCampaign,
      summary
    }), { status: 200 });

  } catch (err: unknown) {
    console.error("API /stats error:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: message }), { status: 500 });
  }
}