import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const TOOLS = [
    {
        name: "V0 (by Vercel)",
        url: "https://v0.dev",
        reason: "Best for building modern React/Next.js UIs and components with natural language.",
        keywords: ["ui", "landing page", "component", "frontend", "design", "css", "tailwind", "interface", "website"]
    },
    {
        name: "Lovable",
        url: "https://lovable.dev",
        reason: "Best for visual full-stack app generation from prompts.",
        keywords: ["app", "startup", "landing page", "visual", "fullstack", "saas", "product"]
    },
    {
        name: "Claude (by Anthropic)",
        url: "https://claude.ai",
        reason: "Best for complex reasoning, long-form writing, advanced coding logic, and analysis.",
        keywords: ["write", "analyze", "explain", "logic", "algorithm", "essay", "blog", "code", "debug", "function", "api", "prolonged", "content", "copy", "prompt"]
    },
    {
        name: "ChatGPT",
        url: "https://chatgpt.com",
        reason: "Best for general knowledge, quick answers, and multi-modal tasks.",
        keywords: ["info", "chat", "general", "quick", "summarize", "writing"]
    },
    {
        name: "Perplexity",
        url: "https://perplexity.ai",
        reason: "Best for real-time research, search, and news.",
        keywords: ["research", "search", "find", "news", "latest", "facts"]
    },
    {
        name: "Midjourney",
        url: "https://midjourney.com",
        reason: "Best for high-quality AI image and art generation.",
        keywords: ["image", "picture", "art", "illustration", "visual", "generate image", "draw"]
    },
    {
        name: "DALL-E",
        url: "https://openai.com/dall-e-3",
        reason: "Good alternative for AI image generation via OpenAI.",
        keywords: ["image", "picture", "art", "design", "dalle"]
    },
    {
        name: "Replit",
        url: "https://replit.com",
        reason: "Best for running, testing, and hosting code in real-time.",
        keywords: ["run", "host", "test", "backend", "python", "node", "server", "deploy"]
    },
    {
        name: "GitHub",
        url: "https://github.com",
        reason: "Best for version control and browsing code repositories.",
        keywords: ["repo", "code", "push", "pull", "git", "history", "open source"]
    }
];

// Heuristic fallback scorer
function analyzeTask(command: string) {
    const cmd = command.toLowerCase();
    return TOOLS.map(tool => {
        let score = 50;
        tool.keywords.forEach(kw => {
            if (cmd.includes(kw)) score += 15;
        });
        return { ...tool, score: Math.min(score, 98) };
    }).sort((a, b) => b.score - a.score);
}

function generateSteps(command: string, tool: { name: string; url: string }) {
    return [
        { action: "open_url", url: tool.url, description: `Opening ${tool.name}` },
        { action: "wait", duration: 2000, description: "Waiting for page to load" },
        { action: "type_text", selector: "textarea, [contenteditable]", text: command, description: "Typing your command" },
        { action: "wait", duration: 1000, description: "Preparing to submit" },
        { action: "click", selector: "button[type=submit], button:last-child", description: "Submitting" },
        { action: "wait", duration: 5000, description: "Waiting for response" },
        { action: "copy_text", selector: "body", description: "Copying result" },
    ];
}

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        try {
            await admin.auth().verifyIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { command } = await req.json();
        if (!command) return NextResponse.json({ error: 'No command provided' }, { status: 400 });

        // ── Groq LLM Neural Analysis ──────────────────────────────────
        if (GROQ_API_KEY) {
            try {
                const systemPrompt = `You are the JARVIS Agent Brain. Analyze the user command and:
1. Select the BEST tool from this list: ${TOOLS.map(t => t.name).join(', ')}.
2. Provide a short reason why.
3. Select 2-3 alternative tools.
4. Generate a list of automation steps for a Chrome extension.

TOOLS DATA:
${JSON.stringify(TOOLS)}

STEP FORMAT:
- { "action": "open_url", "url": "..." }
- { "action": "type_text", "selector": "...", "text": "..." }
- { "action": "click", "selector": "..." }
- { "action": "wait", "duration": 2000 }
- { "action": "copy_text", "selector": "..." }

RESPONSE FORMAT (JSON ONLY, no markdown):
{
  "bestTool": { "name": "...", "url": "...", "reason": "...", "score": 95 },
  "alternatives": [ { "name": "...", "url": "...", "reason": "...", "score": 80 } ],
  "steps": [ ... ],
  "message": "..."
}`;

                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: command }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (groqRes.ok) {
                    const groqData = await groqRes.json();
                    let content = groqData.choices[0].message.content;
                    content = content.replace(/```json|```/g, '').trim();
                    const analysis = JSON.parse(content);
                    return NextResponse.json(analysis, { status: 200 });
                }
            } catch (llmErr) {
                console.error("Groq neural analysis failed, falling back to heuristic:", llmErr);
            }
        }

        // ── Heuristic Fallback ────────────────────────────────────────
        const scored = analyzeTask(command);
        const bestTool = scored[0];
        const alternatives = scored.slice(1, 4);
        const steps = generateSteps(command, bestTool);

        return NextResponse.json({
            bestTool,
            alternatives,
            steps,
            message: `I'll use **${bestTool.name}** for this — ${bestTool.reason}.${alternatives.length > 0 ? ` Alternatives: ${alternatives.map(t => t.name).join(', ')}.` : ''}`,
        }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}