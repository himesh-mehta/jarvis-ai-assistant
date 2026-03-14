import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk/index.mjs';
import admin from '@/lib/firebase-admin';

// Force dynamic to prevent 404/caching on some serverless environments
export const dynamic = 'force-dynamic';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await admin.auth().verifyIdToken(token);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Convert Blob to File-like object for Groq SDK
        const transcription = await groq.audio.transcriptions.create({
            file: file as any,
            model: 'whisper-large-v3',
        });

        return NextResponse.json(transcription);
    } catch (err: any) {
        console.error("[Whisper Error]", err);
        return NextResponse.json({ error: err.message || 'Transcription failed' }, { status: 500 });
    }
}

// Add GET handler to help debug 404s
export async function GET() {
    return NextResponse.json({ status: 'Whisper endpoint is online', methods: ['POST'] });
}
