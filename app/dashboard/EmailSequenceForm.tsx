"use client";
import "@/app/styles/globals.css";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EmailSequenceForm() {
    const [toEmail, setToEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [frequency, setFrequency] = useState("once");
    const [scheduledAt, setScheduledAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccess(false);

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            setErrorMsg("Vous devez être connecté.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from("email_sequences").insert([
            {
                user_id: user.id,
                to_email: toEmail,
                subject,
                body,
                frequency,
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            },
        ]);

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccess(true);
            setToEmail("");
            setSubject("");
            setBody("");
            setFrequency("once");
            setScheduledAt("");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="email-form">
            <h2>Créer une séquence d’e-mails ✉️</h2>

            <label>
                Destinataire
                <input
                    type="email"
                    placeholder="example@courriel.fr"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required
                />
            </label>

            <label>
                Sujet
                <input
                    type="text"
                    placeholder="Objet de la missive enchantée"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
            </label>

            <label>
                Contenu de l’e-mail
                <textarea
                    placeholder="Écris ici ton incantation numérique..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    required
                />
            </label>

            <label>
                Fréquence
                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    <option value="once">Une seule fois</option>
                    <option value="daily">Tous les jours</option>
                    <option value="weekly">Toutes les semaines</option>
                    <option value="monthly">Tous les mois</option>
                    <option value="yearly">Tous les ans</option>
                </select>
            </label>

            <label>
                Date & Heure
                <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                />
            </label>

            {errorMsg && <p className="error">{errorMsg}</p>}
            {success && <p className="success">Séquence enregistrée ✅</p>}

            <button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Créer la séquence"}
            </button>
        </form>
    );
}