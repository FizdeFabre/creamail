// app/api/ai/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.feedbacks || !Array.isArray(body.feedbacks)) {
            return NextResponse.json(
                { error: "Le format attendu est un tableau de chaînes de feedbacks." },
                { status: 400 }
            );
        }

        const formatted = body.feedbacks.map((fb: string, i: number) => `${i + 1}. ${fb}`).join("\n");

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "Tu es une IA spécialisée dans l’analyse de l’expérience client. Résume ces retours en listant les points positifs et négatifs.",
                },
                {
                    role: "user",
                    content: formatted,
                },
            ],
        });

        const summary = completion.choices[0].message?.content ?? "Pas de résumé généré.";
        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error("Erreur IA :", error.message);
        return NextResponse.json(
            { error: "Erreur lors de la génération du résumé." },
            { status: 500 }
        );
    }
}