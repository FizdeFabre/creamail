import "@/app/styles/globals.css";
import "@fontsource-variable/inter";
import { ReactNode } from "react";

export const metadata = {
    title: "EchoNotes",
    description: "Une application magique d'emailing ✨",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="fr">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div className="layout">
                    <main className="main-content">{children}</main>
                </div>
            </body>
        </html>
    );
}
