"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/app/styles/globals.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  sequence: any;
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

  // 🎯 Setup & fetch des destinataires
  useEffect(() => {
    if (!sequence?.id || !open) return;

    setSubject(sequence.subject || "");
    setBody(sequence.body || "");
    setRecurrence(sequence.recurrence || "daily");
    setScheduledAt(sequence.scheduled_at ? sequence.scheduled_at.slice(0, 16) : "");

    const fetchRecipients = async () => {
      const { data, error } = await supabase
        .from("sequence_recipients")
        .select("to_email")
        .eq("sequence_id", sequence.id);

      if (error) {
        console.error("Erreur chargement destinataires :", error.message);
        return;
      }

      const emails = Array.from(
        new Set((data ?? []).map(d => d.to_email.toLowerCase().trim()))
      );
      setToEmail(emails.join(", "));
    };

    fetchRecipients();
  }, [sequence, open]);

  // ✨ Emails bien parsés et dédupliqués
  const parsedEmails = Array.from(
    new Set(
      toEmail
        .split(/[\s,;\n]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e !== "" && isValidEmail(e))
    )
  );

  // 🔥 Handle update avec overwrite et upsert
  const handleUpdate = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Mise à jour de la séquence
      await supabase
        .from("email_sequences")
        .update({
          subject,
          body,
          recurrence,
          scheduled_at: new Date(scheduledAt).toISOString(),
        })
        .eq("id", sequence.id);

      // 2️⃣ Supprimer anciens destinataires
      await supabase
        .from("sequence_recipients")
        .delete()
        .eq("sequence_id", sequence.id);

      // 3️⃣ Upsert des nouveaux destinataires
   if (parsedEmails.length > 0) {
  await supabase.from("sequence_recipients").insert(
    parsedEmails.map(email => ({
      sequence_id: sequence.id,
      to_email: email,
    }))
  );
}

      // 4️⃣ Notifie & ferme
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
          Modify Sequence <span className="text-blue-600">#{sequence.id}</span>
        </h2>

        <div className="space-y-3">
          {/* Emails */}
          <textarea
            className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emails (separated by space, comma or newline)"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-1">
            {parsedEmails.slice(0, 4).map((email, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs font-medium px-2 py-1 rounded"
              >
                {email}
              </span>
            ))}
            {parsedEmails.length > 4 && (
              <span className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-medium px-2 py-1 rounded">
                … And {parsedEmails.length > 99 ? "99+" : parsedEmails.length - 4} Others
              </span>
            )}
          </div>

          {/* Subject */}
          <input
            className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {/* Body */}
          <textarea
            className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Email's body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {/* Recurrence */}
          <select
            className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year</option>
            <option value="once">Once</option>
          </select>

          {/* Date */}
          <input
            type="datetime-local"
            className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-red-700 hover:bg-gray-300 dark:hover:bg-red-300 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Saving"}
          </button>
        </div>
      </div>
    </div>
  );
}