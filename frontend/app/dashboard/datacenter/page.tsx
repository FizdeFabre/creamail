"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/login";
          return;
        }

        const userId = user.id;

        // Récupérer toutes les séquences de l’utilisateur
        const { data: sequencesRaw, error: seqError } = await supabase
          .from("email_sequences")
          .select("sequence_id, campaign_name")
          .eq("user_id", userId);

        if (seqError) throw seqError;

        const sequences = sequencesRaw || [];
        const sequenceIds = sequences.map((s) => s.sequence_id);

        if (!sequenceIds.length) {
          setStats({
            totalSent: 0,
            totalOpened: 0,
            totalResponded: 0,
            openRate: 0,
            responseRate: 0,
            perDay: [],
            variants: [],
            bestCampaign: null,
            worstCampaign: null,
            summary: "Aucune campagne trouvée pour cet utilisateur.",
          });
          return;
        }

        // Récupérer tous les emails envoyés liés aux séquences
        const { data: sendsRaw, error: sendError } = await supabase
          .from("emails_sent")
          .select("sent_at, opened, clicked, responded, variant, sequence_id")
          .in("sequence_id", sequenceIds);

        if (sendError) throw sendError;

        const sends = sendsRaw || [];

        // --- MÉTRIQUES GLOBALES ---
        const totalSent = sends.length;
        const totalOpened = sends.filter((e) => e.opened).length;
        const totalResponded = sends.filter((e) => e.responded).length;
        const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;
        const responseRate = totalSent ? (totalResponded / totalSent) * 100 : 0;

        // --- VARIANTS A/B ---
        const variantMap: Record<
          string,
          { totalSent: number; totalOpened: number; totalResponded: number }
        > = {};

        sends.forEach((e) => {
          const v = e.variant || "A";
          if (!variantMap[v]) {
            variantMap[v] = { totalSent: 0, totalOpened: 0, totalResponded: 0 };
          }
          variantMap[v].totalSent++;
          if (e.opened) variantMap[v].totalOpened++;
          if (e.responded) variantMap[v].totalResponded++;
        });

        const variants: Variant[] = Object.entries(variantMap).map(
          ([variant, stats]) => ({
            variant,
            ...stats,
            openRate: stats.totalSent
              ? (stats.totalOpened / stats.totalSent) * 100
              : 0,
            responseRate: stats.totalSent
              ? (stats.totalResponded / stats.totalSent) * 100
              : 0,
          })
        );

        const winnerRate = variants.length
          ? Math.max(...variants.map((v) => v.openRate))
          : 0;
        variants.forEach((v) => (v.isWinner = v.openRate === winnerRate));

        // --- BEST / WORST CAMPAIGN ---
        let bestCampaign: { campaign: string; rate: number } | null = null;
        let worstCampaign: { campaign: string; rate: number } | null = null;

        sequences.forEach((seq) => {
          const seqSends = sends.filter((e) => e.sequence_id === seq.sequence_id);
          const opened = seqSends.filter((e) => e.opened).length;
          const sent = seqSends.length;
          const rate = sent ? (opened / sent) * 100 : 0;

          if (!bestCampaign || rate > bestCampaign.rate) {
            bestCampaign = { campaign: seq.campaign_name, rate };
          }
          if (!worstCampaign || rate < worstCampaign.rate) {
            worstCampaign = { campaign: seq.campaign_name, rate };
          }
        });

        // --- PAR JOUR ---
        const perDayMap: Record<string, number> = {};
        sends.forEach((e) => {
          if (!e.sent_at) return;
          const day = new Date(e.sent_at).toISOString().slice(0, 10);
          perDayMap[day] = (perDayMap[day] || 0) + 1;
        });

        const perDay = Object.entries(perDayMap).map(([date, count]) => ({
          date,
          count,
        }));

        const bestDay = [...perDay].sort((a, b) => b.count - a.count)[0];
        const summary = bestDay
          ? `Ton meilleur jour est le ${bestDay.date} avec ${bestDay.count} emails envoyés.`
          : "Pas assez de données pour générer un résumé.";

        // --- ENVOI AU STATE ---
        setStats({
          totalSent,
          totalOpened,
          totalResponded,
          openRate,
          responseRate,
          perDay,
          variants,
          bestCampaign,
          worstCampaign,
          summary,
        });
      } catch (err) {
        console.error("Erreur DataCenter:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  if (!stats)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Pas de données disponibles.
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-6">Data Center</h1>
      <p className="text-slate-400 mb-6">{stats.summary}</p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardContent>Total envoyés: {stats.totalSent}</CardContent>
        </Card>
        <Card>
          <CardContent>Ouverts: {stats.totalOpened}</CardContent>
        </Card>
        <Card>
          <CardContent>
            Taux ouverture: {stats.openRate.toFixed(1)}%
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4">
        Activité par jour
      </h2>
      <Card className="mb-10">
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.perDay}>
              <CartesianGrid stroke="#444" />
              <XAxis dataKey="date" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold text-white mb-4">Variants A/B</h2>
      <div className="grid md:grid-cols-variants gap-4">
        {stats.variants.map((v) => (
          <Card
            key={v.variant}
            className={`border ${
              v.isWinner ? "border-green-400" : "border-gray-700"
            }`}
          >
            <CardContent>
              <h3 className="text-lg font-bold text-white mb-2">
                {v.variant} {v.isWinner ? "🏆" : ""}
              </h3>
              <p className="text-slate-400">Envoyés: {v.totalSent}</p>
              <p className="text-slate-400">
                Ouverts: {v.totalOpened} ({v.openRate.toFixed(1)}%)
              </p>
              <p className="text-slate-400">
                Réponses: {v.totalResponded} ({v.responseRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}