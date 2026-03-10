import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

const BRIDGE_URL = process.env.ANDROID_BRIDGE_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  // ── Verify Firebase Token ──────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await admin.auth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { command, params } = await req.json();

  try {
    const res  = await fetch(`${BRIDGE_URL}/execute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ command, params }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      error: 'Android bridge not running. Start: node android-bridge/server.js'
    }, { status: 503 });
  }
}

// ── GET: bridge health check ──────────────────────────
export async function GET() {
  try {
    const res  = await fetch(`${BRIDGE_URL}/health`);
    const data = await res.json();
    return NextResponse.json({ online: true, ...data });
  } catch {
    return NextResponse.json({ online: false });
  }
}