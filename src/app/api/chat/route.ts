// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';
import admin from '@/lib/firebase-admin';

const PROVIDERS = [
    {
        name: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY!,
        model: 'llama-3.3-70b-versatile',
    },
    {
        name: 'gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        apiKey: process.env.GEMINI_API_KEY!,
        model: 'gemini-2.0-flash',
    },
    {
        name: 'huggingface',
        url: 'https://router.huggingface.co/v1/chat/completions',
        apiKey: process.env.HUGGINGFACE_API_KEY!,
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    },
];

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ProviderResult {
    name: string;
    content: string;
    score: number;
    latency: number;
    error?: string;
}

function scoreResponse(content: string, userMessage: string, latencyMs: number): number {
    if (!content || content.trim().length === 0) return 0;

    let score = 50;

    const len = content.trim().length;
    if (len > 800) score += 15;
    else if (len > 300) score += 10;
    else if (len > 100) score += 5;
    else if (len < 30) score -= 20;

    const refusalPatterns = [
        /i('m| am) (not able|unable) to/i,
        /i cannot (provide|help|assist)/i,
        /as an ai(,| language model)/i,
        /i don'?t have (access|the ability)/i,
        /sorry,? (but )?i (can'?t|cannot)/i,
    ];
    if (refusalPatterns.some(p => p.test(content))) score -= 25;

    const userKeywords = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const contentLower = content.toLowerCase();
    const matchCount = userKeywords.filter(kw => contentLower.includes(kw)).length;
    score += Math.min(matchCount * 3, 15);

    if (/```[\s\S]+```/.test(content)) score += 10;
    if (/^\s*[-*•]\s/m.test(content)) score += 5;
    if (/^\s*\d+\.\s/m.test(content)) score += 5;

    if (latencyMs < 1000) score += 5;
    else if (latencyMs < 3000) score += 2;
    else if (latencyMs > 8000) score -= 5;

    const trimmed = content.trim();
    const lastChar = trimmed[trimmed.length - 1];
    if (!['.', '!', '?', '`', '"', "'", ')', ']'].includes(lastChar)) score -= 5;

    return Math.max(0, Math.min(100, score));
}

async function fetchFromProvider(
    provider: typeof PROVIDERS[0],
    messages: Message[]
): Promise<ProviderResult> {
    const start = Date.now();

    try {
        const res = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${provider.apiKey}`,
            },
            body: JSON.stringify({
                model: provider.model,
                messages,
                max_tokens: 1024,
                temperature: 0.7,
            }),
            signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? '';
        const latency = Date.now() - start;

        return {
            name: provider.name,
            content,
            latency,
            score: scoreResponse(content, messages[messages.length - 1].content, latency),
        };
    } catch (err: any) {
        return {
            name: provider.name,
            content: '',
            latency: Date.now() - start,
            score: 0,
            error: err.message,
        };
    }
}

async function fetchFromCohere(apiKey: string, messages: Message[]): Promise<ProviderResult> {
    const start = Date.now();
    try {
        const systemMsg = messages.find(m => m.role === 'system')?.content ?? '';
        const chatMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            }));

        const res = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'command-r-plus',
                messages: [
                    ...(systemMsg ? [{ role: 'system', content: systemMsg }] : []),
                    ...chatMessages
                ],
                max_tokens: 1024,
            }),
            signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const content = data?.message?.content?.[0]?.text ?? '';
        const latency = Date.now() - start;

        return {
            name: 'cohere',
            content,
            latency,
            score: scoreResponse(content, messages[messages.length - 1].content, latency),
        };
    } catch (err: any) {
        return { name: 'cohere', content: '', latency: Date.now() - start, score: 0, error: err.message };
    }
}

// ✅ Detect if message needs web search
function needsWebSearch(message: string): boolean {
    const clean = message.replace(/\[Reply strictly in .+ only\]\s*/i, '').toLowerCase();
    return /today|latest|news|current|now|2025|2026|price|weather|stock|who is|what is happening|recently|right now|score|match|election|ipl|cricket|trending|breaking/i.test(clean);
}

// ✅ Fetch web search results from Tavily
async function fetchWebSearch(query: string, baseUrl: string): Promise<string> {
    try {
        const cleanQuery = query.replace(/\[Reply strictly in .+ only\]\s*/i, '');
        const res = await fetch(`${baseUrl}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: cleanQuery }),
        });

        const data = await res.json();
        if (!data.results?.length) return '';

        const context = data.results
            .map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.content}\nSource: ${r.url}`)
            .join('\n\n');

        console.log('[Web Search] Found results for:', cleanQuery);
        return context;
    } catch (err) {
        console.error('[Web Search] Failed:', err);
        return '';
    }
}

export async function POST(req: NextRequest) {

    // ─── Verify Firebase Token ──────────────────────────
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let uid = '';
    let email = '';
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email ?? '';
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    // ────────────────────────────────────────────────────

    const { message, sessionId, history = [] } = await req.json();

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // ✅ Run web search if needed
    let searchContext = '';
    if (needsWebSearch(message)) {
        searchContext = await fetchWebSearch(message, baseUrl);
    }

    const messages: Message[] = [
        {
            role: 'system',
            content: `You are JARVIS, an advanced AI assistant. Be helpful, intelligent, and concise.
${searchContext ? 'You have been provided real-time web search results. Use them to give accurate up-to-date answers. Mention sources when using web results.' : ''}
CRITICAL LANGUAGE RULE: If the user message starts with [Reply strictly in Hindi only], reply entirely in Hindi. If [Reply strictly in English only], reply entirely in English. Never mix languages.`,
        },
        ...history.filter((m: any) => m.content !== message).slice(-8).map((m: any) => ({
            role: m.role,
            content: m.content,
        })),
        {
            role: 'user',
            content: searchContext
                ? `${message}\n\n[Real-time web search results - use these to answer accurately:]\n${searchContext}`
                : message,
        },
    ];

    const results = await Promise.all([
        fetchFromProvider(PROVIDERS[0], messages),
        fetchFromProvider(PROVIDERS[1], messages),
        fetchFromCohere(process.env.COHERE_API_KEY!, messages),
        fetchFromProvider(PROVIDERS[2], messages),
    ]);

    const best = results
        .filter(r => r.content.length > 0)
        .sort((a, b) => b.score - a.score)[0];

    console.log('[AI Race]', results.map(r => `${r.name}: score=${r.score}, latency=${r.latency}ms${r.error ? ', err=' + r.error : ''}`));
    console.log(`[AI Race] Winner: ${best?.name} (score: ${best?.score})`);

    if (!best) {
        const encoder = new TextEncoder();
        const fallback = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "I'm having trouble connecting right now. Please try again." })}\n\n`));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            },
        });
        return new Response(fallback, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const words = best.content.split(/(\s+)/);
                for (const word of words) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: word, provider: best.name })}\n\n`)
                    );
                    await new Promise(r => setTimeout(r, 15));
                }

                // ─── Save with userId + userEmail ────────
                connectDB().then(() => {
                    Chat.findOneAndUpdate(
                        { sessionId, userId: uid },
                        {
                            $set: { userEmail: email },
                            $setOnInsert: {
                                title: message.slice(0, 50),
                            },
                            $push: {
                                messages: {
                                    $each: [
                                        { role: 'user', content: message, timestamp: new Date() },
                                        { role: 'assistant', content: best.content, timestamp: new Date() },
                                    ],
                                },
                            },
                        },
                        { upsert: true, returnOriginal: false }
                    ).catch(e => console.error("[MongoDB Save Error]", e));
                }).catch(e => console.error("[MongoDB Conn Error]", e));
                // ─────────────────────────────────────────

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            } catch (err: any) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}