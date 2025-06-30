"use client";
import "@/app/styles/globals.css";

import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated";

export default function HomePage() {
  useRedirectIfAuthenticated();

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">EchoNotes</h1>
      <p className="welcome-subtitle">
        Programmez vos pensées. Qu'elles résonnent dans le futur.
      </p>
      <div className="welcome-buttons">
        <a href="/login" className="btn-primary">Connexion</a>
        <a href="/register" className="btn-secondary">Inscription</a>
      </div>
    </div>
  );
}
