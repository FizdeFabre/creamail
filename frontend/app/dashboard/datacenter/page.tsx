"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DataCenterPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.access_token) {
        console.error("No active session, please log in!");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/events/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (res.status === 401) {
          console.error("Unauthorized – token rejected");
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p>Loading …</p>;
  if (!stats) return <p>Impossible de récupérer les données PD !!!</p>;

  return (
    <div>
      <h2>📊 Centre de Données</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}