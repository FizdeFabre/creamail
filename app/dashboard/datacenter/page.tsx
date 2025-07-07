"use client";
import "@/app/styles/datacenter.css";

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

export default function DataCenterPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await fetch("/api/stats");
                if (statsRes.status === 401) throw new Error("Non autorisé");
                const statsData = await statsRes.json();
                setStats(statsData);

                const summaryRes = await fetch("/api/summarize");
                const summaryData = await summaryRes.json();
                if (summaryData.summary) setSummary(summaryData.summary);
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
                <p>Chargement magique en cours... ✨</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="screen center error">
                <p>Impossible de récupérer les données. 😢</p>
            </div>
        );
    }

    return (
        <div className="screen content">
            <h2 className="title">📊 Centre de Données Personnel</h2>

            <div className="stats-grid">
                {[
                    { label: "Emails envoyés", value: stats.totalSent },
                    { label: "Emails ouverts", value: stats.totalOpened },
                    { label: "Réponses reçues", value: stats.totalResponded },
                    { label: "Taux d’ouverture", value: `${stats.openRate}%` },
                    { label: "Taux de réponse", value: `${stats.responseRate}%` },
                ].map((item, idx) => (
                    <div key={idx} className="stat-card">
                        <h3 className="stat-value">{item.value}</h3>
                        <p className="stat-label">{item.label}</p>
                    </div>
                ))}
            </div>

            <div style={{
                background: '#29293d',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem',
            }}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stats.perDay}>
                        <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#888' }} />
                        <Line type="monotone" dataKey="count" stroke="#FF6A6A" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {summary && (
                <div className="summary-box">
                    <h3 className="summary-title">🧠 Résumé des retours</h3>
                    <p className="summary-text">{summary}</p>
                </div>
            )}
        </div>
    );
}