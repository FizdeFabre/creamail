"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [userId, setUserId] = useState<string | null>(null);

    // Profil data
    const [email, setEmail] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [langue, setLangue] = useState("fr");
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // 1) Chargement du profil + application initiale du thème/langue
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) return router.replace("/login");

            setUserId(user.id);
            setEmail(user.email || "");

            // Profil
            const { data: profile, error: pErr } = await supabase
                .from("profiles")
                .select("pseudo, langue, theme")
                .eq("id", user.id)
                .single();

            if (!pErr && profile) {
                setPseudo(profile.pseudo || "");
                setLangue(profile.langue || "fr");
                setTheme(profile.theme === "dark" ? "dark" : "light");
            } else {
                // fallback on localStorage
                const savedLang = localStorage.getItem("langue");
                const savedTheme = localStorage.getItem("theme");
                if (savedLang) setLangue(savedLang);
                if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                    setTheme("dark");
                }
            }

            // Appliquer thème & langue
            document.documentElement.lang = langue;
            document.documentElement.classList.toggle("dark", theme === "dark");
            localStorage.setItem("langue", langue);
            localStorage.setItem("theme", theme);

            setLoading(false);
        };
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // 2) Sauvegarde
    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setErrorMsg("");

        const { error } = await supabase
            .from("profiles")
            .upsert({ id: userId, pseudo, langue, theme });

        if (error) {
            setErrorMsg("Erreur lors de la sauvegarde.");
        } else {
            // applique immédiatement et persiste
            document.documentElement.lang = langue;
            document.documentElement.classList.toggle("dark", theme === "dark");
            localStorage.setItem("langue", langue);
            localStorage.setItem("theme", theme);
            alert("✅ Paramètres sauvegardés !");
        }

        setSaving(false);
    };

    // 3) Déconnexion
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) {
        return <p className="status-text">⏳ Chargement des paramètres...</p>;
    }

    return (
        <div className="settings-container">
            <h1 className="section-title">⚙️ Paramètres</h1>

            <div className="settings-form">
                <label htmlFor="email">Email</label>
                <input id="email" className="input" value={email} disabled />

                <label htmlFor="pseudo">Pseudo</label>
                <input
                    id="pseudo"
                    className="input"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ton blaze de sorcier"
                />

                <label htmlFor="langue">Langue</label>
                <select
                    id="langue"
                    className="select"
                    value={langue}
                    onChange={(e) => setLangue(e.target.value)}
                >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                </select>

                <label htmlFor="theme">Thème</label>
                <select
                    id="theme"
                    className="select"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                >
                    <option value="light">☀️ Clair</option>
                    <option value="dark">🌑 Sombre</option>
                </select>

                {errorMsg && <p className="form-error">{errorMsg}</p>}

                <div className="settings-actions">
                    <button className="btn" onClick={handleSave} disabled={saving}>
                        {saving ? "💾 Sauvegarde..." : "💾 Sauvegarder"}
                    </button>
                    <button className="btn-secondary" onClick={handleLogout}>
                        🚪 Déconnexion
                    </button>
                </div>
            </div>
        </div>
    );
}