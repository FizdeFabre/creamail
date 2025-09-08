// pages/api/events/stats.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key pour lire toutes les tables
);

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized - no token" });

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: "Unauthorized", detail: userError?.message });

    const userId = user.id;

    // Récupérer les séquences
    const { data: sequences, error: seqError } = await supabaseAdmin
      .from("email_sequences")
      .select("id, campaign_name")
      .eq("user_id", userId);
    if (seqError) throw seqError;

    const sequenceIds = sequences.map(s => s.id);
    if (!sequenceIds.length) {
      return res.status(200).json({
        totalSent: 0,
        totalOpened: 0,
        openRate: 0,
        perDay: [],
        perMonth: [],
        variants: [],
      });
    }

    // Récupérer les envois
    const { data: sends, error: sendsError } = await supabaseAdmin
      .from("emails_sent")
      .select("id, sent_at, opened, variant, sequence_id")
      .in("sequence_id", sequenceIds);
    if (sendsError) throw sendsError;

    // Stats globales
    const totalSent = sends.length;
    const totalOpened = sends.filter(e => e.opened).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;

    // Stats par jour / mois
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

    // Stats A/B
    const variantMap = {};
    sends.forEach(e => {
      const v = e.variant || "A";
      if (!variantMap[v]) variantMap[v] = { totalSent: 0, totalOpened: 0 };
      variantMap[v].totalSent++;
      if (e.opened) variantMap[v].totalOpened++;
    });
    const variants = Object.entries(variantMap).map(([variant, stats]) => ({
      variant,
      totalSent: stats.totalSent,
      totalOpened: stats.totalOpened,
      openRate: stats.totalSent ? (stats.totalOpened / stats.totalSent) * 100 : 0
    }));

    return res.status(200).json({ totalSent, totalOpened, openRate, perDay, perMonth, variants });

  } catch (err) {
    console.error("API /stats error:", err);
    return res.status(500).json({ error: "Internal server error", detail: String(err) });
  }
}
