import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';
import admin from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    // ─── Verify Firebase Token ────────────────────────
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ sessions: [], messages: [] });

    let uid = '';
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // ─────────────────────────────────────────────────

    await connectDB();

    const sessionId = req.nextUrl.searchParams.get('sessionId');

    // ─── If sessionId provided → return messages for that session ───
    if (sessionId) {
        const chat = await Chat.findOne({
            sessionId,
            userId: uid           // ← only return if it belongs to this user
        });
        return NextResponse.json({ messages: chat?.messages || [] });
    }

    // ─── No sessionId → return ALL sessions for this user ───────────
    const sessions = await Chat.find(
        { userId: uid },
        { sessionId: 1, title: 1, updatedAt: 1 }   // only return these fields
    ).sort({ updatedAt: -1 });                       // newest first

    return NextResponse.json({ sessions });
}

// ─── DELETE: Remove a session ────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let uid = '';
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    await connectDB();
    await Chat.deleteOne({ sessionId, userId: uid });  // ← only delete if owned by user

    return NextResponse.json({ success: true });
}