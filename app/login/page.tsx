"use client";

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

        if (error) {
            setErrorMsg(error.message);
        } else {
            router.replace("/dashboard");
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleLogin}>
                <h2 className="form-title">Connexion</h2>

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
                    {loading ? "Connexion en cours..." : "Se connecter"}
                </button>

                <p className="status-text" style={{ marginTop: "1rem" }}>
                    Pas encore inscrit·e ? <a href="/register">Créer un compte</a>
                </p>
            </form>
        </div>
    );
}