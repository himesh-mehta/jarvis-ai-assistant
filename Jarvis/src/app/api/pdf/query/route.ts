import "@/lib/serverPolyfills";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import mongoose from 'mongoose';

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const res = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY!}`,
            },
            body: JSON.stringify({ inputs: text }),
        });
        const data = await res.json();

        // HuggingFace returns the vector directly for this model
        if (!Array.isArray(data)) {
            console.error('[Embeddings Error] Unexpected response:', data);
            throw new Error(data.error || 'Failed to get embedding from HuggingFace');
        }

        return data;
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