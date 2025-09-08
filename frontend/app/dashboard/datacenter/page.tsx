"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DataCenterPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // récupère la session active
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Pas de session");

        // fetch API avec Bearer token
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

  if (loading) return <p>Chargement...</p>;
  if (!stats) return <p>Impossible de récupérer les stats 😢</p>;

  return (
    <div>
      <h1>📊 Centre de Données</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}