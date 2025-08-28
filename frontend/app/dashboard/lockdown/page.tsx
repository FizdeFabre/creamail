"use client";

import Link from "next/link";

export default function LockdownPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">🚧 Work in Progress</h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          This page is currently under construction. Please check back later!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}