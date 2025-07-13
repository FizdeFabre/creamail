// app/dashboard/create/page.tsx
"use client";

import { useState } from "react";
import { CreateSequenceDialog } from "@/app/components/CreateSequenceDialog";

export default function Page() {
    const [open, setOpen] = useState(true);
    const fakeUserId = "123"; // ou récupère le vrai si tu veux

    return (
        <div className="p-4">
            <CreateSequenceDialog
                open={open}
                onClose={() => setOpen(false)}
                onCreated={() => alert("✨ Séquence créée !")}
                userId={fakeUserId}
            />
        </div>
    );
}