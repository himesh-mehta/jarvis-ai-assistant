import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    const { message, sessionId, history } = await req.json();

    const messages = [
        {
            role: 'system' as const,
            content: `You are JARVIS, an advanced AI assistant. Be helpful, intelligent, and concise.`,
        },
        ...history,
        { role: 'user' as const, content: message },
    ];

    // Stream response from Groq
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const groqStream = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages,
                    max_tokens: 1024,
                    stream: true,
                });

                let fullReply = '';

                for await (const chunk of groqStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullReply += content;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                }

                // Save to MongoDB after full response
                await connectDB();
                await Chat.findOneAndUpdate(
                    { sessionId },
                    {
                        $push: {
                            messages: {
                                $each: [
                                    { role: 'user', content: message, timestamp: new Date() },
                                    { role: 'assistant', content: fullReply, timestamp: new Date() },
                                ],
                            },
                        },
                    },
                    { upsert: true, new: true }
                );

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