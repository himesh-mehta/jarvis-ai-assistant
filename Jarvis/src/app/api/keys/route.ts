import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import {connectDB} from '../../lib/mongodb';
import ApiKey from '../../lib/models/ApiKey';
import crypto from 'crypto';

// ── Verify Firebase token ─────────────────────────────
async function verifyUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

// ── Generate API key ──────────────────────────────────
function generateKey(): string {
  const random = crypto.randomBytes(24).toString('hex');
  return `sk-jarvis-${random}`;
}

// ── GET: list user's keys ─────────────────────────────
export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const keys = await ApiKey.find(
    { userId: user.uid },
    { key: 0 } // Never return actual key value
  ).sort({ createdAt: -1 });

  // Show only last 8 chars of key for preview
  const safeKeys = keys.map((k) => ({
    ...k.toObject(),
    keyPreview: `sk-jarvis-...${k.key.slice(-8)}`,
  }));

  return NextResponse.json({ keys: safeKeys });
}

// ── POST: create new key ──────────────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // Max 5 keys per user
  const count = await ApiKey.countDocuments({ userId: user.uid });
  if (count >= 5) {
    return NextResponse.json(
      { error: 'Maximum 5 API keys allowed per account' },
      { status: 400 }
    );
  }

  const { name, permissions, rateLimit } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: 'Key name is required' },
      { status: 400 }
    );
  }

  const key = generateKey();

  const apiKey = await ApiKey.create({
    key,
    name:        name.trim(),
    userId:      user.uid,
    userEmail:   user.email,
    permissions: permissions || ['chat', 'search', 'vision', 'voice', 'file'],
    rateLimit:   rateLimit   || { requestsPerDay: 100, requestsPerMin: 10 },
  });

  return NextResponse.json({
    success: true,
    key:     apiKey.key, // Show full key ONCE only on creation
    name:    apiKey.name,
    message: '⚠️ Save this key now! It will never be shown again.',
  });
}

// ── PATCH: toggle key active/inactive ─────────────────
export async function PATCH(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const { keyId, isActive } = await req.json();

  await ApiKey.updateOne(
    { _id: keyId, userId: user.uid },
    { $set: { isActive } }
  );

  return NextResponse.json({ success: true });
}

// ── DELETE: revoke/delete key ─────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const { keyId } = await req.json();

  if (!keyId) {
    return NextResponse.json(
      { error: 'keyId is required' },
      { status: 400 }
    );
  }

  await ApiKey.deleteOne({ _id: keyId, userId: user.uid });

  return NextResponse.json({ success: true });
}