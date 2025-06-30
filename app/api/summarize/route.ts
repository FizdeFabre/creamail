// /app/api/ai/summary/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
console.log("Clé API utilisée (hash):", process.env.OPENAI_API_KEY?.slice(0, 6), "...");
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.feedbacks || !Array.isArray(body.feedbacks)) {
            return NextResponse.json(
                { error: "Le format attendu est un tableau de chaînes de feedbacks." },
                { status: 400 }
            );
        }

        const formattedFeedback = body.feedbacks
            .map((feedback: string, i: number) => `${i + 1}. ${feedback}`)
            .join("\n");

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "Tu es un expert en expérience utilisateur. Résume ces retours clients en listant les points positifs et négatifs.",
                },
                {
                    role: "user",
                    content: `Voici les retours clients :\n${formattedFeedback}`,
                },
            ],
        });

        const summary = completion.choices[0]?.message?.content || "Aucun résumé généré.";
        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error("Erreur AI Summary :", error);
        return NextResponse.json(
            {
                error: `Erreur lors de la génération du résumé : ${error?.message || "inconnue"}`,
            },
            { status: 500 }
        );
    }
}
