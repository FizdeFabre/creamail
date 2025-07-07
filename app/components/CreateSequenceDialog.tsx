"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/app/styles/globals.css";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    userId: string;
    initialData?: any; // ou Sequence
}

export function CreateSequenceDialog({
    open,
    onClose,
    onCreated,
    userId
}: Props) {
    const [toEmail, setToEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [recurrence, setRecurrence] = useState("daily"); // hommage à l'orthographe originelle
    const [scheduledAt, setScheduledAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    if (!open) return null;

    const handleCreate = async () => {
        setLoading(true);
        setError("");

        if (!toEmail || !subject || !body) {
            setError("Tous les champs sont requis.");
            setLoading(false);
            return;
        }

        const { data: authData, error: authError } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
            setError("Impossible de récupérer l'utilisateur. Es-tu connecté ?");
            setLoading(false);
            return;
        }

        const scheduledTimestamp = scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null;

        const { error: insertError } = await supabase.from("email_sequences").insert([
            {
                user_id: user.id,
                to_email: toEmail,
                subject,
                body,
                recurrence,
                scheduled_at: scheduledTimestamp,
                status: "pending",
                sent_at: null,
                error_message: null,
            },
        ]);

        if (insertError) {
            setError("Erreur lors de la création : " + insertError.message);
        } else {
            onCreated();
            onClose();
        }

        setLoading(false);
    };
    return (
        <div className="dialog-overlay">
            <div className="dialog">
                <h2>
                    ✨ Nouvelle Séquence <span>Création</span>
                </h2>

                <div className="dialog-fields">
                    <input
                        className="input"
                        placeholder="📧 Email du destinataire"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                    />
                    <input
                        className="input"
                        placeholder="✏️ Sujet"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                    <textarea
                        className="textarea"
                        rows={4}
                        placeholder="📝 Contenu de l'email"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                    <select
                        className="select"
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                    >
                        <option value="daily">🗓️ Tous les jours</option>
                        <option value="weekly">📅 Toutes les semaines</option>
                        <option value="monthly">🌙 Tous les mois</option>
                        <option value="yearly">🎆 Tous les ans</option>
                        <option value="once">🔔 Une fois</option>
                    </select>
                    <input
                        type="datetime-local"
                        className="datetime"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    {error && <p className="dialog-error">⚠️ {error}</p>}
                </div>

                <div className="actions">
                    <button onClick={onClose} className="btn-secondary" disabled={loading}>
                        ❌ Annuler
                    </button>
                    <button onClick={handleCreate} className="btn-secondary" disabled={loading}>
                        {loading ? "⏳ Création..." : "🚀 Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}