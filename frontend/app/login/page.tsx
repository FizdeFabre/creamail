"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRedirectIfNotAuthenticated } from "@/lib/useRedirectIfAuthenticated";
import Link from "next/link";
export default function LoginPage() {
    useRedirectIfNotAuthenticated();

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
  await supabase.auth.getSession(); // 👈 force la synchro du cookie
  router.replace("/dashboard");
}
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 dark:bg-gray-950 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-6 text-center">
                    🔐 Connection
                </h1>

                <form onSubmit={handleLogin} className="space-y-5">
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
                        {loading ? "Connecting ..." : "Connect"}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-6">
                    Don't have an account yet ?{" "}
                    <Link
                        href="/register"
                        className="text-indigo-600 hover:underline font-medium"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}