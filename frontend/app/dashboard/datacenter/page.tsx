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
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import useSubscription from "@/app/lib/useSubscription";

interface StatsData {
    totalSent: number;
    totalOpened: number;
    totalResponded: number;
    openRate: number;
    responseRate: number;
    perDay: { date: string; count: number }[];
    perMonth?: { date: string; count: number }[];
}

export default function DataCenterPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("jour");
    const { abonnementActif, type_Abonnement } = useSubscription();


   useEffect(() => {
  const fetchData = async () => {
    try {
      const statsRes = await fetch("/api/events/stats", {
  method: "GET",
  credentials: "include",
});
      if (statsRes.status === 401) throw new Error("Non autorisé");
      const statsData = await statsRes.json();
      setStats(statsData);
    
    } catch (e) {
      console.error("Erreur récupération des données :", e);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

    if (loading) {
        return (
            <div className="screen center loading">
                <p>Loading ... </p>
            </div>
        );
    }

    const abonnementsAutorises = ["ultimate"];

    if (!abonnementActif || !abonnementsAutorises.includes(type_Abonnement)) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔒 Accès réservé</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                   This feature is not available unless you have an 

                </p>
                <div></div>
                <p className="text-2xl text-yellow-400 dark:text-yellow-400 mt-5 py-25 text-center">
                    <strong>Ultimate subscription</strong>.
                </p>
                <a
                    href="/dashboard/billing"
                    className="inline-block mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
                >
                    Unlock the datacenter NOW !
                </a>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="screen center error">
                <p>Impossible de récupérer les données, bordel !</p>
            </div>
        );
    }

    return (
        <div className="screen content space-y-10">
            <h2 className="text-3xl font-bold mb-6">📊 Centre de Données Personnel</h2>

            {/* Carte spéciale */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-lg">
                <CardContent className="py-6">
                    <h3 className="text-xl font-semibold"> Meilleure journée d’envoi</h3>
                    <p className="text-4xl font-bold mt-2">{stats.perDay?.sort((a, b) => b.count - a.count)[0]?.count ?? 0} emails</p>
                    <p className="text-sm opacity-80">Le {stats.perDay?.sort((a, b) => b.count - a.count)[0]?.date}</p>
                </CardContent>
            </Card>

            {/* Statistiques principales */}
            <div className="grid md:grid-cols-3 gap-6">
                {[{ label: "Emails envoyés", value: stats.totalSent },
                { label: "Emails ouverts", value: stats.totalOpened },
                { label: "Réponses reçues", value: stats.totalResponded },
                { label: "Taux d’ouverture", value: `${stats.openRate}%` },
                { label: "Taux de réponse", value: `${stats.responseRate}%` }].map((item, idx) => (
                    <Card key={idx} className="shadow-md">
                        <CardContent className="p-6">
                            <h3 className="text-gray-600 text-sm font-medium dark:text-gray-300">{item.label}</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{item.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs pour les graphes */}
            <Tabs defaultValue="jour" onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="jour">📅 Par jour</TabsTrigger>
                    <TabsTrigger value="mois">📆 Par mois</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card className="bg-zinc-900 text-white">
                <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={tab === "jour" ? stats.perDay : stats.perMonth ?? []}>
                            <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                            <XAxis dataKey="date" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#888' }} />
                            <Line type="monotone" dataKey="count" stroke="#FF6A6A" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Résumé narratif */}
            {summary && (
                <Card className="bg-yellow-100 dark:bg-yellow-900/20">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">🧠 Rapport d'activité</h3>
                        <p className="text-sm mt-2 text-gray-800 dark:text-gray-100">{summary}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
