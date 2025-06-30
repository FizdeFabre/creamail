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

interface StatsData {
    totalSent: number;
    totalOpened: number;
    totalResponded: number;
    openRate: number;
    responseRate: number;
    perDay: { date: string; count: number }[];
}

const LineChartC = LineChart as any;
const LineC = Line as any;
const XAxisC = XAxis as any;
const YAxisC = YAxis as any;
const TooltipC = Tooltip as any;
const CartesianGridC = CartesianGrid as any;

export default function DataCenterPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/stats");
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Erreur chargement stats :", err);
            }

            const fetchSummary = async () => {
                try {
                    const res = await fetch("/api/summarize");
                    const data = await res.json();
                    if (data.summary) setSummary(data.summary);
                } catch (e) {
                    console.error("Erreur résumé :", e);
                }
            };
            fetchSummary();
        };
        fetchStats();
    }, []);

    if (!stats) return <p className="text-gray-600">Chargement des stats... 🌀</p>;

    return (
        <div className="min-h-screen bg-white text-black p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 border-b border-[#FFBFAE] pb-2">📊 Centre de Données</h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold">{stats.totalSent}</h3>
                    <p className="text-sm text-gray-600">Emails envoyés</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">{stats.totalOpened}</h3>
                    <p className="text-sm text-gray-600">Emails ouverts</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">{stats.totalResponded}</h3>
                    <p className="text-sm text-gray-600">Réponses reçues</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">{stats.openRate}%</h3>
                    <p className="text-sm text-gray-600">Taux d’ouverture</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">{stats.responseRate}%</h3>
                    <p className="text-sm text-gray-600">Taux de réponse</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChartC data={stats.perDay}>
                    <CartesianGridC strokeDasharray="3 3" />
                    <XAxisC dataKey="date" />
                    <YAxisC allowDecimals={false} />
                    <TooltipC />
                    <LineC type="monotone" dataKey="count" stroke="#FFBFAE" strokeWidth={3} />
                </LineChartC>
            </ResponsiveContainer>
            {summary && (
                <div className="mt-10 p-4 bg-gray-100 rounded-xl border border-gray-300">
                    <h3 className="text-xl font-semibold mb-2">🧠 Résumé des retours clients</h3>
                    <p className="text-gray-800 whitespace-pre-line">{summary}</p>
                </div>
            )}
        </div>

    );
}