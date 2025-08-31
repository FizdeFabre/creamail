"use client";
import "@/app/styles/globals.css";

import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";

export default function HomePage() {
  useRedirectIfAuthenticated();

return (
  <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 px-6 text-center">
    <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-4">
      EchoNotes
    </h1>
    <p className="text-lg text-gray-700 dark:text-gray-300 max-w-xl mb-10">
      Schedule your thoughts. Let them resonate in the future.
    </p>
    <div className="flex gap-6 justify-center">
      <a
        href="/login"
        className="inline-block px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
      >
        Log in
      </a>
      <a
        href="/register"
        className="inline-block px-8 py-3 rounded-lg border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-600 hover:text-white transition"
      >
        Sign up
      </a>
    </div>
  </main>
);
}