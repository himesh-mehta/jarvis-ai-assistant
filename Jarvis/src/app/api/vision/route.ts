import { NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import admin from '@/lib/firebase-admin';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';

export async function POST(req: NextRequest) {
  // ── Verify Firebase Token ──────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  let uid = '', email = '';
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? '';
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  // ── Parse form data ────────────────────────────────
  const formData = await req.formData();
  const file      = formData.get('image') as File;
  const message   = formData.get('message') as string || 'What is in this image?';
  const sessionId = formData.get('sessionId') as string;
  const history   = JSON.parse(formData.get('history') as string || '[]');

  if (!file) return new Response('No image provided', { status: 400 });

  // ── Upload to Cloudinary ───────────────────────────
  let imageUrl = '';
  try {
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploaded = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'jarvis-chats',
          resource_type: 'image',
          transformation: [{ width: 1024, crop: 'limit' }], // resize for faster processing
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    imageUrl = uploaded.secure_url;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Image upload failed: ' + err.message }), { status: 500 });
  }

  // ── Call Groq llama-4 Vision ───────────────────────
  const messages = [
    {
      role: 'system',
      content: 'You are JARVIS, an advanced AI assistant with vision capabilities. Analyze images thoroughly and be helpful.',
    },
    ...history.slice(-6),
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: imageUrl },
        },
        {
          type: 'text',
          text: message,
        },
      ],
    },
  ];

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Groq vision model
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      throw new Error(`Groq error: ${err}`);
    }

    // ── Stream response back ───────────────────────
    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      async start(controller) {
        const reader  = groqRes.body!.getReader();
        const decoder = new TextDecoder();
        let fullReply = '';
        let buffer    = '';

        // Send image URL first so frontend can display it
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ imageUrl })}\n\n`)
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullReply += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {}
          }
        }

        // ── Save to MongoDB ──────────────────────
        await connectDB();
        await Chat.findOneAndUpdate(
          { sessionId, userId: uid },
          {
            $set: { userEmail: email },
            $setOnInsert: { title: message.slice(0, 50) },
            $push: {
              messages: {
                $each: [
                  {
                    role: 'user',
                    content: message,
                    imageUrl,              // ← save image URL
                    timestamp: new Date(),
                  },
                  {
                    role: 'assistant',
                    content: fullReply,
                    timestamp: new Date(),
                  },
                ],
              },
            },
          },
          { upsert: true }
        );

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}