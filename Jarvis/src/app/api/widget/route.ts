import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '../../lib/mongodb';
import ApiKey from '../../lib/models/ApiKey';

// CORS headers — allow any website
const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || !apiKey.startsWith('sk-jarvis-')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB();
    const keyDoc = await ApiKey.findOne({ key: apiKey, isActive: true });
    if (!keyDoc) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Rate limit check
    const today = new Date().toDateString();
    if (keyDoc.usage.lastResetDate !== today) {
      keyDoc.usage.todayRequests = 0;
      keyDoc.usage.lastResetDate = today;
    }
    if (keyDoc.usage.todayRequests >= keyDoc.rateLimit.requestsPerDay) {
      return NextResponse.json(
        { error: 'Daily limit reached' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Update usage
    keyDoc.usage.totalRequests += 1;
    keyDoc.usage.todayRequests += 1;
    keyDoc.usage.lastUsed = new Date();
    await keyDoc.save();

    const { message, history = [], systemPrompt } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Call Groq
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model:      'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: [
            {
              role:    'system',
              content: systemPrompt ||
                'You are a helpful AI assistant. Be concise and friendly.',
            },
            ...history.slice(-10), // Last 10 messages only
            { role: 'user', content: message },
          ],
        }),
      }
    );

    const data    = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json(
      { success: true, message: content },
      { headers: corsHeaders }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}