"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";

export default function RegisterPage() {
    useRedirectIfAuthenticated();

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            // Tu peux aussi rediriger vers une page d'attente de confirmation mail si tu veux
            router.replace("/login");
        }

        setLoading(false);
    };
    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleRegister}>
                <h1 className="form-title">Inscription</h1>

                <label className="form-label">
                    <span>Email</span>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        required
                    />
                </label>

                {errorMsg && <p className="form-error">{errorMsg}</p>}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ marginTop: '1.5rem' }}
                >
                    {loading ? "Inscription en cours..." : "Créer un compte"}
                </button>
            </form>
        </div>
    );

}
