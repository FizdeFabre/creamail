"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const [activeTab, setActiveTab] = useState("jour");
  const [sessionDebug, setSessionDebug] = useState<any>(null); // ⚠ pour debug
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 1. Vérifier la session ---
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Session fetch result:", { session, error });
        setSessionDebug({ session, error });

        // ⚠ Si pas de session, on continue quand même pour debug
        const token = session?.access_token ?? "FAKE_TOKEN"; // FAKE_TOKEN juste pour debug local

        // --- 2. Appel API ---
        const res = await fetch("/api/events/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Fetch /api/events/stats status:", res.status);

        if (!res.ok) {
          const errText = await res.text();
          console.error("Erreur stats HTTP:", res.status, errText);
          throw new Error(`Erreur stats: HTTP ${res.status} - ${errText}`);
        }

        const statsData = await res.json();
        console.log("Stats data fetched:", statsData);
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-400 text-lg">Loading Data Center...</p>
      </div>
    );
  }

  // ⚠ Affichage debug de la session
  if (!stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-center bg-slate-800/50 border border-amber-500/30 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-2">Could Not Load Data</h2>
          <p className="text-slate-400 max-w-md">Check the console for detailed debug info.</p>
        </div>
        <pre className="text-xs text-slate-200 bg-slate-900 p-4 rounded-lg overflow-auto">
          {JSON.stringify(sessionDebug, null, 2)}
        </pre>
      </div>
    );
  }

  // --- Ici ton code normal pour afficher stats ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden p-6 lg:p-8">
      <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
        Data Center (DEBUG MODE)
      </h1>

      <div className="mt-6">
        <p className="text-slate-400 mb-4">{stats.summary}</p>
        <div className="grid md:grid-cols-3 gap-6">
          <Card><CardContent>Emails envoyés: {stats.totalSent}</CardContent></Card>
          <Card><CardContent>Emails ouverts: {stats.totalOpened}</CardContent></Card>
          <Card><CardContent>Taux d'ouverture: {stats.openRate.toFixed(2)}%</CardContent></Card>
        </div>
      </div>

      {/* Ici tu peux rajouter ton graphique et variants comme avant */}
    </div>
  );
}