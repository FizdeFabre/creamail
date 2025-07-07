// app/layout.tsx
import "@/app/styles/globals.css"; // Ton fichier magique CSS
import "@fontsource-variable/inter"; // Optionnel si tu gardes Inter

import type { Metadata } from "next";
import { ReactNode, useEffect } from "react";

export const metadata: Metadata = {
    title: "EchoNotes",
    description: "Une application magique d'emailing ✨",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                {/* Police secondaire via Google Fonts */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div className="layout">
                    <main className="main-content">{children}</main>
                </div>

                {/* Script pour appliquer le mode sombre dès le premier paint (évite le flash de thème) */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (_) {}
              })();
            `,
                    }}
                />
            </body>
        </html>
    );
}