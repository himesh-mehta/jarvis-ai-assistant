import { NextRequest } from 'next/server';
import { tavily } from '@tavily/core';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function POST(req: NextRequest) {
    const { query } = await req.json();

    try {
        const result = await client.search(query, {
            maxResults: 5,
            searchDepth: 'basic',
        });

        return Response.json({ results: result.results });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
