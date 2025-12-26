
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY } = await req.json().catch(() => ({}));

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required (provide in body or set GOOGLE_GENERATIVE_AI_API_KEY env var)' }, { status: 400 });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Google API Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();

        // Filter for models that support content generation (chat/text)
        // and cleanup names (remove 'models/' prefix for display if needed, but keep for value)
        const models = (data.models || [])
            .filter((kafka: any) =>
                kafka.supportedGenerationMethods &&
                (kafka.supportedGenerationMethods.includes("generateContent") ||
                    kafka.supportedGenerationMethods.includes("generateMessage"))
            )
            .map((m: any) => ({
                id: m.name.replace('models/', ''), // 'models/gemini-pro' -> 'gemini-pro'
                name: m.displayName,
                description: m.description
            }));

        return NextResponse.json({ models });

    } catch (error: any) {
        console.error("Error fetching Google models:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
