"use client";
import { useState, FormEvent } from "react";

export default function EmailScheduler() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [datetime, setDatetime] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:8000/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, message, datetime }),
            });

            const data = await res.json();
            alert("⏰ Email programmé : " + data.status);
        } catch (err) {
            console.error("Erreur lors de l'envoi :", err);
            alert("💀 Échec de l'envoi.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold">📬 Planifier un e-mail</h2>

            <input
                type="email"
                placeholder="Adresse email"
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <textarea
                placeholder="Votre message"
                className="w-full p-2 border rounded"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
            />

            <input
                type="datetime-local"
                className="w-full p-2 border rounded"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
            />

            <button
                type="submit"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded"
            >
                Planifier
            </button>
        </form>
    );
}