"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";

interface Variant {
  variant: string;
  totalSent: number;
  totalOpened: number;
  totalResponded: number;
  openRate: number;
  responseRate: number;
  isWinner?: boolean;
}

interface StatsData {
  totalSent: number;
  totalOpened: number;
  totalResponded: number;
  openRate: number;
  responseRate: number;
  perDay: { date: string; count: number }[];
  perMonth: { date: string; count: number }[];
  perHour: { hour: string; count: number }[];
  variants: Variant[];
  bestCampaign: { campaign: string; rate: number } | null;
  worstCampaign: { campaign: string; rate: number } | null;
  summary: string;
}

export default function DataCenterPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1️⃣ Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.warn("Pas de session → redirection login ?");
          window.location.href = "/login";
          return;
        }
        const userId = user.id;

        // 2️⃣ Récupérer les séquences
        const { data: sequencesRaw, error: seqError } = await supabase
          .from("email_sequences")
          .select("id, campaign_name")
          .eq("user_id", userId);
        if (seqError) throw seqError;

        const sequences = sequencesRaw || [];
        const sequenceIds = sequences.map(s => s.id);
        if (!sequenceIds.length) {
          setStats({
            totalSent: 0,
            totalOpened: 0,
            totalResponded: 0,
            openRate: 0,
            responseRate: 0,
            perDay: [],
            perMonth: [],
            perHour: [],
            variants: [],
            bestCampaign: null,
            worstCampaign: null,
            summary: "Aucune campagne trouvée pour cet utilisateur."
          });
          return;
        }

        // 3️⃣ Récupérer tous les emails envoyés
        const { data: sendsRaw, error: sendsError } = await supabase
          .from("emails_sent")
          .select("id, sent_at, opened, clicked, responded, variant, sequence_id")
          .in("sequence_id", sequenceIds);
        if (sendsError) throw sendsError;

        const sends = sendsRaw || [];

        // 4️⃣ Calculer les métriques globales
        const totalSent = sends.length;
        const totalOpened = sends.filter(e => e.opened).length;
        const totalResponded = sends.filter(e => e.responded).length;
        const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;
        const responseRate = totalSent ? (totalResponded / totalSent) * 100 : 0;

        // 5️⃣ Variants A/B
        const variantMap: Record<string, { totalSent: number; totalOpened: number; totalResponded: number }> = {};
        sends.forEach(e => {
          const v = e.variant || "A";
          if (!variantMap[v]) variantMap[v] = { totalSent: 0, totalOpened: 0, totalResponded: 0 };
          variantMap[v].totalSent++;
          if (e.opened) variantMap[v].totalOpened++;
          if (e.responded) variantMap[v].totalResponded++;
        });

        const variants: Variant[] = Object.entries(variantMap).map(([variant, stats]) => ({
          variant,
          ...stats,
          openRate: stats.totalSent ? (stats.totalOpened / stats.totalSent) * 100 : 0,
          responseRate: stats.totalSent ? (stats.totalResponded / stats.totalSent) * 100 : 0,
        }));
        const winnerRate = Math.max(...variants.map(v => v.openRate));
        variants.forEach(v => v.isWinner = v.openRate === winnerRate);

        // 6️⃣ Best / Worst Campaign
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

        // 7️⃣ Résumé
        const perDayMap: Record<string, number> = {};
        sends.forEach(e => {
          if (!e.sent_at) return;
          const day = new Date(e.sent_at).toISOString().slice(0, 10);
          perDayMap[day] = (perDayMap[day] || 0) + 1;
        });
        const perDay = Object.entries(perDayMap).map(([date, count]) => ({ date, count }));
        const bestDay = perDay.sort((a,b) => b.count - a.count)[0];
        const summary = bestDay
          ? `Ton meilleur jour est le ${bestDay.date} avec ${bestDay.count} ouvertures.`
          : "Pas assez de données pour générer un résumé.";

        // 8️⃣ Mettre à jour le state
        setStats({
          totalSent,
          totalOpened,
          totalResponded,
          openRate,
          responseRate,
          perDay,
          perMonth: [],
          perHour: [],
          variants,
          bestCampaign,
          worstCampaign,
          summary
        });

      } catch (err) {
        console.error("Erreur DataCenter:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!stats) return <div className="min-h-screen flex items-center justify-center">Pas de données disponibles.</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Data Center</h1>
      <p className="text-slate-400 mb-6">{stats.summary}</p>
      <div className="grid md:grid-cols-3 gap-6">
        <Card><CardContent>Total envoyés: {stats.totalSent}</CardContent></Card>
        <Card><CardContent>Ouverts: {stats.totalOpened}</CardContent></Card>
        <Card><CardContent>Taux ouverture: {stats.openRate.toFixed(1)}%</CardContent></Card>
      </div>
    </div>
  );
}