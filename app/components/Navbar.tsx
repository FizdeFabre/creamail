// frontend/app/components/Navbar.tsx
import Link from "next/link";
import "@/app/styles/globals.css";

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
            <Link href="/">
                <span className="text-xl font-bold text-indigo-600">EchoNotes</span>
            </Link>
            <div className="space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
                    Dashboard
                </Link>
                <Link href="/settings" className="text-gray-700 hover:text-indigo-600">
                    Paramètres
                </Link>
            </div>
        </nav>
    );
}