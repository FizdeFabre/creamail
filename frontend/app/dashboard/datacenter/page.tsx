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
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Pas de session active");

        const res = await fetch("/api/events/stats", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Erreur stats: HTTP ${res.status} - ${errText}`);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <p className="text-slate-400 text-lg">Loading Data Center...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-slate-800/50 border border-amber-500/30 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-2">Could Not Load Data</h2>
          <p className="text-slate-400 max-w-md">An error occurred while retrieving stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 z-0" />

      <div className="relative z-10 p-6 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Data Center
          </h1>
          <p className="text-slate-400 text-lg mt-2">Advanced analytics and insights</p>
        </motion.div>

        {/* Summary */}
        {stats.summary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <p className="text-slate-200 font-medium">{stats.summary}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Emails envoyés", value: stats.totalSent },
            { label: "Emails ouverts", value: stats.totalOpened },
            { label: "Taux d'ouverture", value: stats.openRate.toFixed(2) + "%" },
          ].map((item, idx) => (
            <Card key={idx} className="shadow-md bg-slate-800/40 backdrop-blur-sm border border-slate-700">
              <CardContent>
                <h3 className="text-slate-400 text-sm font-medium">{item.label}</h3>
                <p className="text-3xl font-bold text-slate-100 mt-2">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Cards */}
        <div className="flex gap-4">
          {stats.bestCampaign && (
            <Card className="bg-green-800/30 flex-1 border border-green-500/30 backdrop-blur-sm">
              <CardContent>
                <h3 className="text-green-400 font-semibold">🔥 Meilleure campagne</h3>
                <p className="text-slate-100">{stats.bestCampaign.campaign} ({stats.bestCampaign.rate.toFixed(2)}%)</p>
              </CardContent>
            </Card>
          )}
          {stats.worstCampaign && (
            <Card className="bg-red-800/30 flex-1 border border-red-500/30 backdrop-blur-sm">
              <CardContent>
                <h3 className="text-red-400 font-semibold">😢 Moins performante</h3>
                <p className="text-slate-100">{stats.worstCampaign.campaign} ({stats.worstCampaign.rate.toFixed(2)}%)</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs Graph */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="jour" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Daily View</TabsTrigger>
              <TabsTrigger value="mois" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Monthly View</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="bg-slate-800/40 border border-slate-700 backdrop-blur-sm">
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activeTab === "jour" ? stats.perDay : stats.perMonth}>
                  <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                  <XAxis dataKey={activeTab === "jour" ? "date" : "date"} stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#888' }} />
                  <Line type="monotone" dataKey="count" stroke="#FF6A6A" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* A/B Variant Cards */}
        <h3 className="text-xl font-semibold text-slate-200">A/B Testing</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {stats.variants.map(v => (
            <Card key={v.variant} className={`shadow-md bg-slate-800/40 border border-slate-700 backdrop-blur-sm ${v.isWinner ? "border-yellow-400" : ""}`}>
              <CardContent>
                <h4 className="text-slate-100 font-medium">Variant {v.variant} {v.isWinner ? "🏆" : ""}</h4>
                <p className="text-slate-300 text-sm">Envoyés : {v.totalSent}</p>
                <p className="text-slate-300 text-sm">Ouverts : {v.totalOpened}</p>
                <p className="text-slate-300 text-sm">Taux : {v.openRate.toFixed(2)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}