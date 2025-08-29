// CreateSequenceDialog.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/app/styles/globals.css";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    userId: string;
}

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function localDateTimeToUTCISOString(localDateTime: string): string {
  if (!localDateTime) throw new Error("Empty datetime");

  // localDateTime format: "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // On fabrique une Date en UTC à partir des composants locaux
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return d.toISOString();
}

export function CreateSequenceDialog({
    open,
    onClose,
    onCreated,
    userId,
}: Props) {
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

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
            setError("Falling to identify user");
            setLoading(false);
            return;
        }
const scheduledTimestamp = localDateTimeToUTCISOString(scheduledAt);
        if (!scheduledTimestamp) {
            setError("Invalid date");
            setLoading(false);
            return;
        }

        const { data: insertData, error: insertError } = await supabase
            .from("email_sequences")
            .insert([
                {
                    user_id: user.id,
                    subject,
                    body,
                    recurrence,
                    scheduled_at: scheduledTimestamp,
                    status: "pending",
                    sent_at: null,
                    error_message: null,
                },
            ])
            .select()
            .single();

        if (insertError || !insertData) {
            setError("Error during creation : " + insertError?.message);
            setLoading(false);
            return;
        }

        const sequenceId = insertData.id;
        const recipientInserts = parsedEmails.map((email) => ({
            sequence_id: sequenceId,
            to_email: email,
        }));

        const { error: recipientError } = await supabase
            .from("sequence_recipients")
            .insert(recipientInserts);

        if (recipientError) {
            setError(" Recipient error : " + recipientError.message);
            setLoading(false);
            return;
        }

        onCreated();
        onClose();
        setLoading(false);
    };

    const date = new Date("2025-08-06T11:05");
    console.log(date.toISOString());            // → 2025-08-06T09:05:00.000Z
    console.log(date.toLocaleString());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
                <h2 className="text-2xl font-semibold">
                    New sequence <span className="text-blue-600">Creation</span>
                </h2>

                <div className="space-y-3">
                    <textarea
                        className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Emails (separated by a space or a ',')"
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

                    <input
                        className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                    <textarea
                        className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Email's body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                    <select
                        className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                    >
                        <option value="daily">Everyday </option>
                        <option value="weekly">Every week</option>
                        <option value="monthly">Every month</option>
                        <option value="yearly">Every year</option>
                        <option value="once">Once</option>
                    </select>
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
                        onClick={handleCreate}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? " Creation..." : "Create !"}
                    </button>
                </div>
            </div>
        </div>
    );
}