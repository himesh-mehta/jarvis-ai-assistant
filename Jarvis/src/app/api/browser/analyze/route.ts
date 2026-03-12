// src/app/api/browser/analyze/route.ts
import { NextRequest } from 'next/server';
import admin from '@/lib/firebase-admin';

const TOOLS = [
  { id: 'lovable',    name: 'Lovable',         url: 'https://lovable.dev',         best_for: 'full app, landing page, UI' },
  { id: 'v0',         name: 'v0.dev',           url: 'https://v0.dev',              best_for: 'React components, shadcn' },
  { id: 'claude',     name: 'Claude.ai',        url: 'https://claude.ai',           best_for: 'writing, analysis, long prompts' },
  { id: 'copilot',    name: 'GitHub Copilot',   url: 'https://github.com/copilot',  best_for: 'code, debugging, functions' },
  { id: 'midjourney', name: 'Midjourney',       url: 'https://midjourney.com',      best_for: 'images, art, visuals' },
];

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try { await admin.auth().verifyIdToken(token); }
  catch { return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 }); }

  const { task } = await req.json();

  const prompt = `You are JARVIS. Pick the best AI tool for this task.
Task: "${task}"
Tools: ${JSON.stringify(TOOLS)}
Reply in pure JSON only (no markdown, no backticks):
{
  "best": "tool_id",
  "reason": "one line why",
  "alternatives": ["tool_id2"],
  "refined_prompt": "rewritten prompt optimized for the chosen tool",
  "steps": [
    {"action": "navigate", "url": "tool url"},
    {"action": "click", "selector": "prompt input box"},
    {"action": "type", "selector": "prompt input", "text": "REFINED_PROMPT"},
    {"action": "screenshot"}
  ]
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';

  try {
    const parsed = JSON.parse(content);
    return new Response(
      JSON.stringify({ ...parsed, tools: TOOLS }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Parse failed', raw: content }),
      { status: 500 }
    );
  }
}