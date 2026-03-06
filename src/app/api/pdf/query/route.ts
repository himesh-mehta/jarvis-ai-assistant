import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import mongoose from 'mongoose';

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
            },
            body: JSON.stringify({
                model: 'nomic-embed-text-v1_5',
                input: text,
            }),
        });
        const data = await res.json();
        
        if (!data.data || !data.data[0]) {
            console.error('[Embeddings Error] Invalid response:', data);
            throw new Error(data.error?.message || 'Failed to get embedding');
        }
        
        return data.data[0].embedding;
    } catch (err) {
        console.error('[Embeddings fetch failed]', err);
        throw err;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { question, userId } = await req.json();

        const conn = await connectDB();
        if (!conn.connection.db) throw new Error('Database not initialized');
        const collection = conn.connection.db.collection('pdfdocs');

        // Convert question to vector
        const questionEmbedding = await getEmbedding(question);

        // Search MongoDB for matching chunks
        const results = await collection.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: questionEmbedding,
                    numCandidates: 50,
                    limit: 5,
                    filter: { userId },
                },
            },
            {
                $project: {
                    content: 1,
                    fileName: 1,
                    score: { $meta: 'vectorSearchScore' },
                },
            },
        ]).toArray();

        if (!results.length) {
            return NextResponse.json({ context: '', sources: [] });
        }

        const context = results.map((r: any) => r.content).join('\n\n');
        const sources = [...new Set(results.map((r: any) => r.fileName))];

        return NextResponse.json({ context, sources });

    } catch (err: any) {
        console.error('[PDF Query Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}