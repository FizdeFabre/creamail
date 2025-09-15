"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function localDateTimeToUTCISOString(localDateTime: string): string {
  const [datePart, timePart] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
}

export function CreateSequenceDialog({ open, onClose, onCreated, userId }: Props) {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recurrence, setRecurrence] = useState("daily");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const parsedEmails = toEmail
    .split(/[\s,;\n]+/)
    .map((e) => e.trim())
    .filter((e) => e !== "");

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    if (!parsedEmails.length || !subject || !body || !scheduledAt) {
      setError("Filling everything is required");
      setLoading(false);
      return;
    }

    if (!parsedEmails.every(isValidEmail)) {
      setError("One or several emails are incorrect");
      setLoading(false);
      return;
    }

    const scheduledTimestamp = localDateTimeToUTCISOString(scheduledAt);

    const { data: insertData, error: insertError } = await supabase
      .from("email_sequences")
      .insert([
        {
          user_id: userId,
          subject,
          body,
          recurrence,
          scheduled_at: scheduledTimestamp,
          status: "pending",
        },
      ])
      .select("sequence_id")
      .single();

    if (insertError || !insertData?.sequence_id) {
      setError("Error during creation: " + insertError?.message);
      setLoading(false);
      return;
    }

    const sequenceId = insertData.sequence_id;

    const recipientInserts = parsedEmails.map((email) => ({
      sequence_id: sequenceId,
      to_email: email,
    }));

    const { error: recipientError } = await supabase
      .from("sequence_recipients")
      .insert(recipientInserts);

    if (recipientError) {
      setError("Recipient error: " + recipientError.message);
      setLoading(false);
      return;
    }

    onCreated();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
        <h2 className="text-2xl font-semibold">New sequence Creation</h2>

        <textarea
          className="w-full p-2 rounded border"
          placeholder="Emails (space, comma, or ; separated)"
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
          placeholder="Email body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />

        <select
          className="w-full p-2 rounded border"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          <option value="daily">Everyday</option>
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

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-4 pt-4">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create!"}
          </button>
        </div>
      </div>
    </div>
  );
}