import { NextRequest } from 'next/server';
import admin from '@/lib/firebase-admin';
import WebSocket from 'ws';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const WS_SERVER_URL = process.env.WS_SERVER_URL || 'wss://jarvis-ws-server-production.up.railway.app';
const WS_SECRET_TOKEN = process.env.WS_SECRET_TOKEN || 'your-secret-token';

export async function POST(req: NextRequest) {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const { command } = await req.json();

    // 2. Use Groq to parse natural language into steps
    const steps = await parseCommandWithAI(command);
    console.log('Parsed steps:', steps);

    // 3. Create a stream to send back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const ws = new WebSocket(WS_SERVER_URL);
            const requestId = Math.random().toString(36).substring(7);

            const cleanup = () => {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            };

            const timeout = setTimeout(() => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Command timed out' })}\n\n`));
                controller.close();
                cleanup();
            }, 60000);

            ws.on('open', () => {
                // Register as app
                ws.send(JSON.stringify({
                    type: 'register',
                    role: 'app',
                    token: WS_SECRET_TOKEN
                }));

                // Send steps one by one or as a batch?
                // User's requirement says "Show each step executing in real time"
                // So we'll send the whole batch to the extension, and have the extension report back each step's result.
                ws.send(JSON.stringify({
                    type: 'command',
                    command: { steps },
                    requestId,
                    token: WS_SECRET_TOKEN
                }));
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'started', steps })}\n\n`));
            });

            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.requestId === requestId) {
                    if (message.type === 'result') {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message.payload)}\n\n`));
                        
                        // If it's the final result (e.g. screenshot or the last step)
                        if (message.payload.final || message.payload.status === 'error' || message.payload.action === 'screenshot') {
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                            clearTimeout(timeout);
                            controller.close();
                            cleanup();
                        }
                    }
                }
            });

            ws.on('error', (err) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'WebSocket error: ' + err.message })}\n\n`));
                controller.close();
                cleanup();
            });

            ws.on('close', () => {
                // If it closed before we finished
                try { controller.close(); } catch (e) {}
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

async function parseCommandWithAI(command: string) {
    const prompt = `You are a browser automation expert. Convert the following natural language command into a JSON array of browser steps.
Supported actions:
- {"action": "navigate", "url": "URL"}
- {"action": "click", "selector": "CSS_SELECTOR_OR_TEXT"}
- {"action": "type", "selector": "CSS_SELECTOR_OR_TEXT", "text": "TEXT"}
- {"action": "scroll", "amount": 500}
- {"action": "wait", "ms": 2000}
- {"action": "extract"} (get page text)
- {"action": "screenshot"}

Rules:
1. Return ONLY a JSON array.
2. Be precise with selectors. Use common IDs/Classes or descriptive text.
3. If navigation is needed first, include it.
4. End with a screenshot if the task involves seeing a result.
5. For search engines, type the query and add "\\n" to the end of the text to trigger Enter.

Command: "${command}"
JSON Response:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    try {
        const parsed = JSON.parse(content);
        return parsed.steps || parsed; // Handle both {steps: []} and []
    } catch (e) {
        return [{ action: 'error', message: 'Failed to parse AI response' }];
    }
}
