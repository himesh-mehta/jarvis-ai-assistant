import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { connectDB } from '@/app/lib/mongodb';
import UserMemory from '@/app/lib/models/UserMemory';

// ── GET: fetch user memory ────────────────────────────────
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    await connectDB();

    const memory = await UserMemory.findOne({ userId: decoded.uid });
    return NextResponse.json({ memory: memory || null });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// ── DELETE: clear a specific fact or all memory ───────────
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded  = await admin.auth().verifyIdToken(token);
    const { factId, clearAll } = await req.json();
    await connectDB();

    if (clearAll) {
      // Wipe all memory
      await UserMemory.findOneAndUpdate(
        { userId: decoded.uid },
        { $set: { facts: [], summary: '' } }
      );
    } else if (factId) {
      // Remove specific fact
      await UserMemory.findOneAndUpdate(
        { userId: decoded.uid },
        { $pull: { facts: { _id: factId } } }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}