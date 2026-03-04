import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/mongodb';
import Chat from '../../lib/models/ChatModel';

export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ messages: [] });

    await connectDB();
    const chat = await Chat.findOne({ sessionId });
    return NextResponse.json({ messages: chat?.messages || [] });
}