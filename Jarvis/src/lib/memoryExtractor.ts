import { connectDB } from '@/app/lib/mongodb';
import UserMemory from '@/app/lib/models/UserMemory';

export async function extractAndSaveMemory(
    userId: string,
    userEmail: string,
    userMessage: string,
    aiResponse: string,
    groqApiKey: string
) {
    try {
        // ── Ask Groq to extract facts ──────────────────────────
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',  // fast small model for extraction
                max_tokens: 500,
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: `You are a memory extraction system. Extract ONLY new, important, 
            long-term facts about the USER from this conversation.

            Categories:
            - personal: name, age, location, job, family
            - preference: likes, dislikes, communication style, language
            - technical: tech stack, tools, languages, frameworks they use
            - behavioral: how they work, their habits, their style
            - goal: what they are building, their objectives

            Rules:
            - Extract ONLY facts about the USER, not general knowledge
            - Only extract HIGH VALUE facts worth remembering long-term
            - Ignore small talk, greetings, and temporary context
            - Be specific and concise
            - If nothing worth remembering, return empty array

            Respond ONLY with valid JSON, no markdown:
            {
              "facts": [
                {
                  "category": "technical",
                  "fact": "Uses Next.js with TypeScript",
                  "confidence": 0.9
                }
              ],
              "summary": "Brief updated summary of user in 1-2 sentences"
            }`
                    },
                    {
                        role: 'user',
                        content: `User message: "${userMessage}"\nAI response: "${aiResponse.slice(0, 500)}"`
                    }
                ],
            }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';

        let extracted: { facts: any[]; summary: string };
        try {
            extracted = JSON.parse(content.replace(/```json|```/g, '').trim());
        } catch {
            return; // if parsing fails, skip silently
        }

        if (!extracted.facts?.length) return;

        // ── Save to MongoDB ────────────────────────────────────
        await connectDB();

        // Get existing memory
        const existing = await UserMemory.findOne({ userId });
        const existingFacts = existing?.facts?.map((f: any) => f.fact.toLowerCase()) || [];

        // Filter out duplicate facts
        const newFacts = extracted.facts
            .filter(f => f.fact && !existingFacts.some(
                (ef: string) => ef.includes(f.fact.toLowerCase().slice(0, 20))
            ))
            .map(f => ({
                ...f,
                source: userMessage.slice(0, 100),
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

        if (!newFacts.length && !extracted.summary) return;

        await UserMemory.findOneAndUpdate(
            { userId },
            {
                $set: {
                    userEmail,
                    ...(extracted.summary ? { summary: extracted.summary } : {}),
                },
                $push: newFacts.length ? {
                    facts: { $each: newFacts, $slice: -100 }  // keep last 100 facts max
                } : {},
            },
            { upsert: true }
        );

    } catch (err) {
        console.error('[Memory Extraction Error]', err);
        // Never block the main chat flow
    }
}