import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

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

        const groqFormData = new FormData();
        groqFormData.append('file', file, 'audio.m4a');
        groqFormData.append('model', 'whisper-large-v3');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: groqFormData,
        });

        const data = await groqRes.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
