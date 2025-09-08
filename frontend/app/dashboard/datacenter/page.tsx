"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DataCenterPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("jour");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Pas de session active");

        const res = await fetch("/api/events/stats", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-lg animate-pulse">Chargement des données...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-lg text-red-500">Impossible de récupérer les données 😢</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h2 className="text-3xl font-bold mb-6 text-center">📊 Centre de Données</h2>

      {/* Statistiques principales */}
      <div className="grid md:grid-cols-4 gap-6">
        {[ 
          { label: "Emails envoyés", value: stats.totalSent },
          { label: "Emails ouverts", value: stats.totalOpened },
          { label: "Taux d’ouverture", value: `${stats.openRate.toFixed(1)}%` },
          { label: "Variants A/B", value: stats.variants.length }
        ].map((item, idx) => (
          <Card key={idx} className="shadow-md">
            <CardContent className="p-6 text-center">
              <h3 className="text-gray-600 text-sm font-medium dark:text-gray-300">{item.label}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs pour graphes */}
      <Tabs defaultValue="jour" onValueChange={setTab}>
        <TabsList className="flex justify-center">
          <TabsTrigger value="jour">📅 Par jour</TabsTrigger>
          <TabsTrigger value="mois">📆 Par mois</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Graph */}
      <Card className="bg-zinc-900 text-white">
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={tab === "jour" ? stats.perDay : stats.perMonth}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: "#222", borderColor: "#888" }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#FF6A6A"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Résultats A/B */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">⚖️ Résultats des variants</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {stats.variants.map((v: any, idx: number) => (
              <Card key={idx} className="bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-lg">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold">Variant {v.variant}</h4>
                  <p className="mt-2">📩 Envoyés : {v.totalSent}</p>
                  <p className="mt-1">📬 Ouverts : {v.totalOpened}</p>
                  <p className="mt-1">📈 Taux : {v.openRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}