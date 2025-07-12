"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
    open: boolean;
    onClose: () => void;
    onUpdated: () => void;
    sequenceId: string;
}

export default function EditSequenceDialog({ open, onClose, onUpdated, sequenceId }: Props) {
    const [toEmail, setToEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [recurrence, setRecurrence] = useState("daily");
    const [scheduledAt, setScheduledAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        async function fetchSequence() {
            setLoading(true);
            const { data, error } = await supabase
                .from("email_sequences")
                .select("*")
                .eq("id", sequenceId)
                .single();

            if (error || !data) {
                setError("Erreur lors du chargement de la séquence.");
            } else {
                setToEmail(data.to_email);
                setSubject(data.subject);
                setBody(data.body);
                setRecurrence(data.recurrence);
                setScheduledAt(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : "");
                setError("");
            }
            setLoading(false);
        }

        fetchSequence();
    }, [open, sequenceId]);

    async function handleEdit() {
        setLoading(true);
        setError("");

        if (!toEmail || !subject || !body) {
            setError("Tous les champs sont requis.");
            setLoading(false);
            return;
        }

        const scheduledTimestamp = scheduledAt
            ? new Date(scheduledAt + ":00")?.toISOString()
            : null;

        const { error } = await supabase
            .from("email_sequences")
            .update({
                to_email: toEmail,
                subject,
                body,
                recurrence,
                scheduled_at: scheduledTimestamp,
            })
            .eq("id", sequenceId);

        if (error) {
            setError("Erreur lors de la mise à jour : " + error.message);
        } else {
            onUpdated();
            onClose();
        }
        setLoading(false);
    }

    if (!open) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog">
                <h2>🛠️ Modifier la Séquence</h2>
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
                    <button onClick={handleEdit} className="btn-primary" disabled={loading}>
                        {loading ? "⏳ Mise à jour..." : "💾 Sauvegarder"}
                    </button>
                </div>
            </div>
        </div>
    );
}
