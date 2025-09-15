"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CreateSequenceDialog } from "@/app/components/CreateSequenceDialog";
import { EditSequenceDialog } from "@/app/components/EditSequenceDialog";
import { MultiEmailDisplay } from "@/app/components/MultiEmailDisplay";
import useSubscription from "@/app/lib/useSubscription";
import { formatUtcToLocal } from "@/app/lib/dateUtils";
import { toPostgresTimestamp } from "@/app/lib/dateUtils";

interface Sequence {
  sequence_id: string;   // ⬅️ remplacer id par sequence_id
  created_at: string;
  subject: string;
  body: string;
  to_email: string[];
  recurrence: string;
  scheduled_at: string | null;
  user_id: string;
  status: string;
}

type SequenceRecipient = {
  to_email: string [] | string;
};

export default function Dashboard() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [sortOption, setSortOption] = useState("created_desc");
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<Sequence | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const { type_Abonnement, loading: subLoading } = useSubscription();

  const getMaxSequences = () => {
    switch (type_Abonnement) {
      case "premium": return 60;
      case "ultimate": return Infinity;
      case "gratuit":
      default: return 2;
    }
  };

  const canCreateSequence = sequences.length < getMaxSequences();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.replace("/login"); return; }
      setUserId(user.id);
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (userId) loadSequences(userId, sortOption);
  }, [userId, sortOption]);

  const loadSequences = async (uid: string, sort: string) => {
    setLoading(true);
    let query = supabase
  .from("email_sequences")
  .select(`
    sequence_id,
    created_at,
    body,
    subject,
    user_id,
    status,
    scheduled_at,
    recurrence,
    sequence_recipients:sequence_recipients(to_email)
  `)
  .eq("user_id", uid);

    if (sort === "created_asc" || sort === "created_desc") {
      query = query.order("created_at", { ascending: sort === "created_asc" });
    } else if (sort === "subject_asc" || sort === "subject_desc") {
      query = query.order("subject", { ascending: sort === "subject_asc" });
    }

    const { data, error } = await query;
    if (error) { setLoading(false); return; }
    if (!data || data.length === 0) { setSequences([]); setLoading(false); return; }

    const formatted: Sequence[] = data.map((seq: any) => ({
      ...seq,
      to_email: Array.isArray(seq.sequence_recipients)
        ? seq.sequence_recipients.map((r: any) => r.to_email)
        : [],
    }));

    const finalSorted = ["email_asc", "email_desc"].includes(sort)
      ? sortSequencesClientSide(formatted, sort)
      : formatted;

    setSequences(finalSorted);
    setLoading(false);
  };

  const sortSequencesClientSide = (list: Sequence[], option: string) => {
    return [...list].sort((a, b) => {
      const emailA = (a.to_email[0] || "").toLowerCase();
      const emailB = (b.to_email[0] || "").toLowerCase();
      switch (option) {
        case "email_asc": return emailA.localeCompare(emailB);
        case "email_desc": return emailB.localeCompare(emailA);
        default: return 0;
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sequence?")) return;
    const { error } = await supabase.from("email_sequences").delete().eq("sequence_id", id);
if (!error) {
  setSequences(prev => prev.filter(s => s.sequence_id !== id));
        setErrorMsg("Sequence deleted!");
        setTimeout(() => setErrorMsg(""), 3000);
      }
  };

  const handleCreate = async (newSequence: {
  subject: string;
  body: string;
  recurrence: string;
  scheduled_at: string | null;
  to_email: string[];
}) => {
  if (!userId) return;

  // 1️⃣ Créer la séquence seule
  const { data: created, error: seqError } = await supabase
    .from("email_sequences")
    .insert({
      subject: newSequence.subject,
      body: newSequence.body,
      recurrence: newSequence.recurrence,
      scheduled_at: newSequence.scheduled_at,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select("sequence_id")
    .single();

  if (seqError || !created) {
    console.error("Failed to create sequence", seqError);
    setErrorMsg("Erreur création séquence");
    return;
  }

  // 2️⃣ Ajouter les destinataires un par un dans sequence_recipients
const recipientInserts = newSequence.to_email.map((email) => ({
  sequence_id: created.sequence_id,
  to_email: email,
  user_id: userId, // 👈 important pour passer les policies
}));

  if (recipientInserts.length > 0) {
    const { error: recError } = await supabase
      .from("sequence_recipients")
      .insert(recipientInserts);

    if (recError) {
      console.error("Recipient insert error:", recError);
      setErrorMsg("Erreur destinataires : " + recError.message);
      return;
    }
  }

  // 3️⃣ Recharge la liste
  loadSequences(userId, sortOption);
};

  const handleDuplicate = async (id: string) => {
    if (!canCreateSequence) {
      setErrorMsg("Limit reached for your subscription. Cannot duplicate.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    // 1️⃣ Récupère la séquence avec ses recipients
    const { data, error } = await supabase
      .from("email_sequences")
      .select("*, sequence_recipients(to_email)")
      .eq("sequence_id", id)
      .single();

    if (error || !data) return;

    const { subject, body, recurrence, scheduled_at, sequence_recipients } = data;
    const isoDate = scheduled_at ? toPostgresTimestamp(scheduled_at) : null;

    // 2️⃣ Crée la nouvelle séquence et récupère bien l'ID
const { data: newSequence, error: insertError } = await supabase
  .from("email_sequences")
  .insert({
    subject: subject + " (copy)",
    body,
    recurrence,
    scheduled_at: isoDate,
    user_id: userId,
    created_at: new Date().toISOString(),
  })
  .select("sequence_id")   // 👈 récupérer sequence_id
  .single();

if (insertError || !newSequence?.sequence_id) {
  console.error("Failed to create new sequence", insertError);
  return;
}

// 👇 Utiliser sequence_id et pas id
const recipientInserts = (sequence_recipients || []).map((r: SequenceRecipient) => ({
  sequence_id: newSequence.sequence_id,
  to_email: r.to_email,
}));

    if (recipientInserts.length > 0) {
      const { error: recipientsError } = await supabase
        .from("sequence_recipients")
        .insert(recipientInserts);

      if (recipientsError) {
        console.error("Recipient error:", recipientsError);
        setErrorMsg("⚠️ Recipient error: " + recipientsError.message);
        return;
      }
    }

    // 4️⃣ Recharge la liste
    if (userId) loadSequences(userId, sortOption);
  };

  const handleEdit = (sequence: Sequence) => {
    setEditData({
      ...sequence,
      scheduled_at: sequence.scheduled_at,
    });
    setShowEditDialog(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-extrabold mb-10 text-gray-900 dark:text-white">
        Dashboard (Beta)
      </h1>

      <div className="flex flex-wrap gap-4 mb-10">
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canCreateSequence}
        >
          Create sequence
        </button>
        {!canCreateSequence && (
          <p className="text-sm text-red-500 font-semibold">
            Limit reached for your subscription ({type_Abonnement})!
          </p>
        )}
        <button
          onClick={() => router.push("/dashboard/datacenter")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          View statistics (Coming soon)
        </button>
        <button
          onClick={() => router.push("/dashboard/calendar")}
          className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          Calendar 
        </button>
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          Settings
        </button>
        <button
          onClick={() => router.push("/dashboard/lockdown")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          Billing (Coming soon)
        </button>
      </div>

      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">
          Sort by:
        </label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
        >
          <option value="created_desc">🕒 Newest</option>
          <option value="created_asc">🕒 Oldest</option>
          <option value="email_asc">📧 Email A-Z</option>
          <option value="email_desc">📧 Email Z-A</option>
          <option value="subject_asc">📌 Subject A-Z</option>
          <option value="subject_desc">📌 Subject Z-A</option>
        </select>
      </div>

      {showCreateDialog && userId && (
        <CreateSequenceDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => userId && loadSequences(userId, sortOption)}
          userId={userId}
        />
      )}

      {showEditDialog && editData && (
        <EditSequenceDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditData(null);
          }}
          onUpdated={() => userId && loadSequences(userId, sortOption)}
          sequence={editData}
        />
      )}

      {selectedSequence && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="relative max-w-4xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
      
      {/* Bouton fermer en haut à droite */}
      <button
        onClick={() => setSelectedSequence(null)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      >
        Back to the Dashboard
      </button>

      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {selectedSequence.subject}
      </h2>

      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">To:</p>
        <MultiEmailDisplay emails={selectedSequence.to_email} />
      </div>

      <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-6 overflow-y-auto border border-dashed border-gray-300 dark:border-gray-600 rounded p-4 max-h-[250px]">
        {selectedSequence.body}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p><strong>Recurrence:</strong> <em>{selectedSequence.recurrence}</em></p>
        <p>
          <strong>Scheduled for:</strong>{" "}
          <span className="font-mono">
            {formatUtcToLocal(selectedSequence.scheduled_at)}
          </span>
        </p>
      </div>
    </div>
  </div>
)}

      {loading ? (
        <p className="text-center text-lg text-gray-600 dark:text-gray-300">Loading...</p>
      ) : sequences.length === 0 ? (
        <p className="text-center text-lg text-gray-500 dark:text-gray-400">No sequences found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {sequences.map((seq) => (
            <li
              key={seq.sequence_id}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                setSelectedSequence(seq);
              }}
              className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md hover:ring-2 hover:ring-pink-500 hover:scale-[1.01] transition-transform duration-150 flex flex-col justify-between h-[420px] overflow-hidden"
            >
              <div className="flex flex-col gap-2 flex-grow overflow-hidden">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{seq.subject}</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  To: <MultiEmailDisplay emails={seq.to_email} />
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 overflow-y-auto border border-dashed border-gray-300 dark:border-gray-600 rounded p-2 flex-grow max-h-[150px]">
                  {seq.body}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <p><strong>Recurrence:</strong> <em>{seq.recurrence}</em></p>
                  <p>
                    <strong>Scheduled for:</strong>{" "}
                    <span className="font-mono">
                      {formatUtcToLocal(seq.scheduled_at)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 shrink-0">
                <button
                  onClick={() => handleEdit(seq)}
                  className="bg-indigo-500 hover:bg-purple-600 text-white py-2 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(seq.sequence_id)}
                  disabled={!canCreateSequence}
                  className="bg-yellow-500 hover:bg-purple-600 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => setDeleteTarget(seq)}
                  className="bg-red-500 hover:bg-purple-600 text-white py-2 rounded-md"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-2xl w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Delete confirmation
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the sequence <strong>{deleteTarget.subject}</strong>?
              This action is <span className="text-red-600 font-semibold">irreversible</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-red-700 dark:bg-red-800 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("email_sequences")
                    .delete()
                    .eq("sequence_id", deleteTarget.sequence_id);
                  if (!error) {
                    setSequences((prev) => prev.filter((s) => s.sequence_id !== deleteTarget.sequence_id));
                    setErrorMsg("Sequence deleted!");
                    setTimeout(() => setErrorMsg(""), 3000);
                  }
                  setDeleteTarget(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}