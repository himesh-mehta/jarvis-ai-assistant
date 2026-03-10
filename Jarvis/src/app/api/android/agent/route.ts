import { NextRequest } from 'next/server';
import admin from '@/lib/firebase-admin';

const BRIDGE_URL = process.env.ANDROID_BRIDGE_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    await admin.auth().verifyIdToken(token);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const { task } = await req.json();

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        send({ step: '🧠 Analyzing task...' });

        // ── Ask Groq for steps ────────────────────────
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model:       'moonshotai/kimi-k2-instruct-0905',
            messages: [{
              role:    'system',
              content: `You are an Android automation agent. Break tasks into ADB command steps.
Available commands: open_app, type_text, wait, screenshot, go_home, press_back, google_search, open_youtube_search, set_volume, lock_screen
Return ONLY a JSON array, no markdown:
[{"command":"open_app","params":{"app":"youtube"},"description":"Opening YouTube"}]`
            }, {
              role:    'user',
              content: `Task: ${task}`,
            }],
          }),
        });

        const data    = await res.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const steps   = JSON.parse(content.replace(/```json|```/g, '').trim());

        send({ step: `📋 Breaking into ${steps.length} steps...` });

        // ── Execute each step ─────────────────────────
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          send({ step: `⚡ Step ${i+1}/${steps.length}: ${step.description || step.command}` });

          if (step.command === 'wait') {
            await new Promise(r => setTimeout(r, step.params?.ms || 2000));
            continue;
          }

          try {
            await fetch(`${BRIDGE_URL}/execute`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ command: step.command, params: step.params }),
            });
          } catch {
            send({ step: `⚠️ Step ${i+1} failed, continuing...` });
          }

          await new Promise(r => setTimeout(r, 1500));
        }

        send({ done: `All ${steps.length} steps completed!` });
      } catch (err: any) {
        send({ error: err.message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  });
}