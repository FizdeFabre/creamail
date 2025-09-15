  "use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toPostgresTimestamp } from "@/app/lib/dateUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  sequence: {
    sequence_id: string;
    subject: string;
    body: string;
    recurrence: string;
    scheduled_at: string | null;
  };
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function EditSequenceDialog({ open, onClose, onUpdated, sequence }: Props) {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recurrence, setRecurrence] = useState("daily");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger données quand on ouvre le dialog
  useEffect(() => {
    if (!sequence?.sequence_id || !open) return;

    setSubject(sequence.subject || "");
    setBody(sequence.body || "");
    setRecurrence(sequence.recurrence || "daily");
    setScheduledAt(sequence.scheduled_at ? sequence.scheduled_at.slice(0, 16) : "");

    const fetchRecipients = async () => {
      const { data, error } = await supabase
        .from("sequence_recipients")
        .select("to_email")
        .eq("sequence_id", sequence.sequence_id);

      if (error) {
        console.error("Erreur chargement destinataires :", error.message);
        return;
      }

      const emails = Array.from(
        new Set((data ?? []).map((d) => d.to_email.toLowerCase().trim()))
      );
      setToEmail(emails.join(", "));
    };

    fetchRecipients();
  }, [sequence, open]);

  // Nettoyage & validation des emails
  const parsedEmails = Array.from(
    new Set(
      toEmail
        .split(/[\s,;\n]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e !== "" && isValidEmail(e))
    )
  );

  // Mise à jour de la séquence et des destinataires
  const handleUpdate = async () => {
    setLoading(true);
    setError("");

    if (!parsedEmails.length || !subject || !body || !scheduledAt) {
      setError("Filling everything is required");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Mettre à jour la séquence
      const { error: seqError } = await supabase
        .from("email_sequences")
        .update({
          subject,
          body,
          recurrence,
          scheduled_at: toPostgresTimestamp(scheduledAt),
        })
        .eq("sequence_id", sequence.sequence_id);

      if (seqError) throw seqError;

      // 2️⃣ Supprimer anciens destinataires
      const { error: delError } = await supabase
        .from("sequence_recipients")
        .delete()
        .eq("sequence_id", sequence.sequence_id);

      if (delError) throw delError;

      // 3️⃣ Ajouter les nouveaux destinataires
      if (parsedEmails.length > 0) {
        const { error: insertError } = await supabase
          .from("sequence_recipients")
          .insert(parsedEmails.map((email) => ({
            sequence_id: sequence.sequence_id,
            to_email: email,
          })));

        if (insertError) throw insertError;
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
        <h2 className="text-2xl font-semibold">
          Modify Sequence <span className="text-blue-600">#{sequence.subject}</span>
        </h2>

        <div className="space-y-3">
          <textarea
            className="w-full p-2 rounded border"
            placeholder="Emails (comma/space/newline separated)"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            rows={3}
          />

          <input
            className="w-full p-2 rounded border"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <textarea
            className="w-full p-2 rounded border"
            rows={4}
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <select
            className="w-full p-2 rounded border"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
            <option value="once">Once</option>
          </select>

          <input
            type="datetime-local"
            className="w-full p-2 rounded border"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded bg-blue-600 text-white"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}