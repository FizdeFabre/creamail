"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const SUPPORTED_LANGUAGES = ["English", "Français", "Espanol", "Deutsch"] as const;
type Langue = typeof SUPPORTED_LANGUAGES[number];

export default function SettingsPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [langue, setLangue] = useState<Langue>("English");
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (error || !user) return router.replace("/login");

            setEmail(user.email || "");

            const { data: profile } = await supabase
                .from("profiles")
                .select("pseudo, langue, theme")
                .eq("id", user.id)
                .single();

            if (profile) {
                setPseudo(profile.pseudo || "");
                setLangue(profile.langue || "English");
                setTheme(profile.theme || "light");
            }

            setLoading(false);
        };

        fetchData();
    }, [router]);

    const handleSave = async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        await supabase.from("profiles").upsert({
            id: user.user.id,
            pseudo,
            langue,
            theme,
        });
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    if (loading) return <p className="text-center pt-10">Loading ...</p>;

    return (

        <div className="max-w-xl mx-auto mt-10 space-y-6">
            <div className="max-w-6xl mx-auto py-12 px-6">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-indigo-600 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
                >
                    ← Back to the Dashboard
                </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Settings
            </h1>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                        Personnal Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                        Username ( Pretty useless for now ... )
                    </label>
                    <input
                        type="text"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                        className="bg-white dark:bg-gray-900 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                    />
                </div>

                <div className="flex flex-col relative">
                    <label className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                        Language ( Not working yet ... )
                    </label>
                    <select
                        value={langue}
                        onChange={(e) => setLangue(e.target.value as Langue)}
                        className="appearance-none bg-white dark:bg-gray-900 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                                {lang.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <span className="text-gray-700 dark:text-gray-300">Theme</span>
                    <button
                        onClick={toggleTheme}
                        className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                    >
                        {theme === "light" ? " Clear Mode " : " Dark Mode"}
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-black dark:bg-blue-600 text-white py-2 rounded-md hover:opacity-90 transition font-medium"
                >
                    Saving Changes
                </button>
            </div>
        </div>
    );
}