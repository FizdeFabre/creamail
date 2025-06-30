"use client";
import "@/app/styles/globals.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";

export default function LoginPage() {
    useRedirectIfAuthenticated();

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log("DATA:", data);
        console.log("ERROR:", error);

        if (error) {
            setErrorMsg(error.message);
        } else {
            const user_id = data?.user?.id;
            console.log("✅ ID Utilisateur connecté :", user_id);

            // Stocke l'ID où tu veux (dans un contexte, du localStorage, ou tu l'utilises direct)
            // Exemple : window.localStorage.setItem("user_id", user_id)

            router.replace("/dashboard");
        }

        setLoading(false);
    };
    return (
        <div className="login-page">
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                <h2 className="form-title">Inscription</h2>

                <label className="form-label">
                    <span>Email</span>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="exemple@poudlard.edu"
                        required
                    />
                </label>

                <label className="form-label">
                    <span>Mot de passe</span>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="********"
                        required
                    />
                </label>

                <label className="form-label">
                    <span>Confirmer le mot de passe</span>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="********"
                        required
                    />
                </label>

                {/* Message d’erreur optionnel */}
                {/* <div className="form-error">Les mots de passe ne correspondent pas !</div> */}

                <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                    S'inscrire
                </button>

                <p className="status-text" style={{ marginTop: '1rem' }}>
                    Déjà inscrit·e ? <a href="/login">Connecte-toi ici</a>
                </p>
            </form>
        </div>
    );
}