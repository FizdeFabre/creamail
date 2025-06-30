// app/lib/ai.ts
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function synthesizeResponses(feedbacks: string[]): Promise<string> {
    const formatted = feedbacks.map((f, i) => `${i + 1}. ${f}`).join("\n");

    const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "Tu es une IA qui résume des retours clients.",
            },
            {
                role: "user",
                content: formatted,
            },
        ],
    });

    return res.choices[0].message?.content ?? "Pas de résumé généré.";
}