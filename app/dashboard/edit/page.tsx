"use client";

import { useState } from "react";
import EditSequenceDialog from "@/app/components/EditSequenceDialog";

export default function EditPage() {
    // Remplace "sequence-id-placeholder" par un vrai ID plus tard
    const [open, setOpen] = useState(true);
    const sequenceId = "sequence-id-placeholder";

    return (
        <>
            <EditSequenceDialog
                open={open}
                onClose={() => setOpen(false)}
                onUpdated={() => {
                    alert("Séquence mise à jour !");
                }}
                sequenceId={sequenceId}
            />
            {!open && <p>La modale est fermée. Tu peux revenir en arrière ou fermer l’onglet.</p>}
        </>
    );
}