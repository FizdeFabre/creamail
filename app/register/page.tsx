"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";

export default function RegisterPage() {
    useRedirectIfAuthenticated();

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (!pseudo.trim()) {
            setErrorMsg("Le pseudo est obligatoire !");
            setLoading(false);
            return;
        }

        // Créer user dans Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
            return;
        }

        // Insérer pseudo dans profils
        if (data.user?.id) {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert([{ id: data.user.id, pseudo, langue: "fr", theme: "light" }]);

            if (profileError) {
                setErrorMsg("Erreur lors de la création du profil.");
                setLoading(false);
                return;
            }
        }

        router.replace("/login");
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleRegister}>
                <h2 className="form-title">Créer un compte</h2>

                <label className="form-label">
                    <span>Email</span>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemple@poudlard.edu"
                        required
                    />
                </label>

                <label className="form-label">
                    <span>Pseudo</span>
                    <input
                        type="text"
                        className="form-input"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                        placeholder="Ton blaze de sorcier"
                        required
                    />
                </label>

                <label className="form-label">
                    <span>Mot de passe</span>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                    />
                </label>

                {errorMsg && <p className="form-error">{errorMsg}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Création en cours..." : "Créer un compte"}
                </button>

                <p className="status-text" style={{ marginTop: "1rem" }}>
                    Déjà inscrit·e ? <a href="/login">Connecte-toi ici</a>
                </p>
            </form>
        </div>
    );
}