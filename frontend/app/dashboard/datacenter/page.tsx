"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

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
    const fetchData = async () => {
      try {
        // 🟢 Ici on ne demande PAS de session
        // On tape direct ton API backend qui utilise DEBUG_USER_ID si besoin
        const res = await fetch("/api/events/stats");

        if (!res.ok) {
          throw new Error(`Erreur stats HTTP ${res.status}: ${await res.text()}`);
        }

        const statsData = await res.json();
        setStats(statsData);

      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!stats) {
    return <div className="min-h-screen flex items-center justify-center">Pas de données disponibles.</div>;
  }

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