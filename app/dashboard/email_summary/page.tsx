"use client";

import { useState } from "react";

const mockFeedbacks = [
    "Le service client est très réactif.",
    "L’interface est un peu lente.",
    "Manque de tailles disponibles.",
    "Livraison rapide mais emballage abîmé.",
    "Super appli, mais quelques bugs."
];

export default function DatacenterPage() {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbacks: mockFeedbacks }),
            });

            const data = await res.json();
            console.log("Réponse AI :", data);
            setSummary(data.summary || "Pas de résumé reçu.");
        } catch (err) {
            console.error("Erreur frontend :", err);
            setSummary("Erreur lors de la génération.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="datacenter-container">
            <h1>🧠 Résumé des Feedbacks</h1>

            <ul className="feedback-list">
                {mockFeedbacks.map((f, i) => (
                    <li key={i}>{f}</li>
                ))}
            </ul>

            <button onClick={handleGenerate} disabled={loading}>
                {loading ? "Chargement..." : "Générer Résumé IA"}
            </button>

            {summary && (
                <div className="summary-block">
                    <h2>✨ Résumé :</h2>
                    <pre>{summary}</pre>
                </div>
            )}

            <style jsx>{`
        .datacenter-container {
          max-width: 700px;
          margin: 2rem auto;
          padding: 2rem;
          font-family: Arial, sans-serif;
          color: #222;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .feedback-list {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 2rem;
        }

        button {
          background-color: #333;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
        }

        button:hover:enabled {
          background-color: #555;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .summary-block {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f0f0f0;
          border-radius: 8px;
        }

        pre {
          white-space: pre-wrap;
          font-size: 1rem;
          margin-top: 0.5rem;
        }
      `}</style>
        </div>
    );
}