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
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-6 text-center">
                    🪄 Create an account
                </h1>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="exemple@email.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Your username"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        {loading ? "Connecting ..." : "Create an account"}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-6">
                    Already an account ?{" "}
                    <a href="/login" className="text-indigo-600 hover:underline font-medium">
                        Log in !
                    </a>
                </p>
            </div>
        </main>
    );
}