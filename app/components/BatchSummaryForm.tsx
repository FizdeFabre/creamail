'use client'
import { useState } from 'react'

export default function BatchSummaryForm() {
    const [responses, setResponses] = useState('')
    const [summary, setSummary] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSummarize = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbacks: responses.split('\n\n') }),
            })
            const data = await res.json()
            setSummary(data.summary)
        } catch (err) {
            setSummary('Erreur lors de la génération.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="summary-wrapper">
            <h2>🔍 Analyse de Feedbacks Clients</h2>
            <textarea
                placeholder="Colle ici tous les retours clients séparés par 2 sauts de ligne"
                value={responses}
                onChange={(e) => setResponses(e.target.value)}
            />
            <div className="buttons">
                <button onClick={handleSummarize} disabled={loading}>
                    {loading ? 'Analyse en cours...' : 'Lancer le résumé'}
                </button>
                <button onClick={() => { setResponses(''); setSummary(''); }}>
                    Réinitialiser
                </button>
            </div>
            {summary && (
                <div className="result">
                    <h3>📝 Résumé généré</h3>
                    <p>{summary}</p>
                </div>
            )}
        </div>
    )
}