"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CreateSequenceDialog } from "@/app/dashboard/create/page";
import "@/app/styles/globals.css"; // Attention à bien l'importer

interface Sequence {
  id: string;
  created_at: string;
  subject: string;
  body: string;
  to_email: string;
  recurrence: string;
  scheduled_at: string;
  user_id: string;
}

export default function Dashboard() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (userId) loadSequences(userId);
  }, [userId]);

  const loadSequences = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    setSequences(error ? [] : data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette séquence ?")) return;
    const { error } = await supabase.from("email_sequences").delete().eq("id", id);
    if (!error) setSequences((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDuplicate = async (id: string) => {
    const { data, error } = await supabase.from("email_sequences").select("*").eq("id", id).single();
    if (error || !data) return;
    const { subject, body, to_email, recurrence, scheduled_at } = data;
    await supabase.from("email_sequences").insert({
      subject: subject + " (copie)",
      body,
      to_email,
      recurrence,
      scheduled_at,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    if (userId) loadSequences(userId);
  };

  return (
    <div className="dashboard-container">
      <h1 className="section-title">📬 Mon Dashboard Email</h1>

      <div className="action-bar">
        <button onClick={() => setShowDialog(true)} className="btn">
          🍑 Créer une séquence
        </button>
        <button onClick={() => router.push("/dashboard/datacenter")} className="btn-secondary">
          📈 Voir les Stats
        </button>
        <button onClick={() => router.push("/dashboard/email_summary")} className="btn-alt">
          🧠 Résumé IA
        </button>
      </div>

      {showDialog && userId && (
        <CreateSequenceDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onCreated={() => userId && loadSequences(userId)}
          userId={userId}
        />
      )}

      {loading ? (
        <p className="status-text">⏳ Chargement...</p>
      ) : sequences.length === 0 ? (
        <p className="status-text">Aucune séquence trouvée. ✨</p>
      ) : (
        <ul className="sequence-grid">
          {sequences.map((seq) => (
            <li key={seq.id} className="card">
              <div>
                <h3>{seq.subject}</h3>
                <p className="to-email">À : {seq.to_email}</p>
                <p className="body-preview">{seq.body}</p>
                <p className="meta">
                  <strong>Récurrence :</strong> <em>{seq.recurrence}</em><br />
                  <strong>Prévu le :</strong>{" "}
                  <span className="mono">
                    {new Date(seq.scheduled_at).toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="actions">
                <button onClick={() => router.push(`/edit/${seq.id}`)}>✏️ Modifier</button>
                <button onClick={() => handleDuplicate(seq.id)}>📄 Dupliquer</button>
                <button onClick={() => handleDelete(seq.id)}>🗑 Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}