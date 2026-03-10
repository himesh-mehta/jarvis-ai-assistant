import "@/lib/serverPolyfills";
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';
import { validateFile, uploadFileToCloudinary, ACCEPTED_TYPES } from '@/lib/fileUpload';
// Dynamically required inside the handler to prevent bundling issues in Next.js App Router

// ✅ Groq embeddings
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

// ✅ Simpler splitter to replace problematic LangChain splitters
function splitTextDirectly(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - chunkOverlap;
        if (i < 0) break; // overlap too large
    }
    return chunks;
}

export async function POST(req: NextRequest) {
    // ── Verify Firebase Token ──────────────────────────────
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let uid = '', email = '';
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email ?? '';
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // ── Parse FormData ─────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: 'No sessionId provided' }, { status: 400 });

    // ── Validate file ──────────────────────────────────────
    const validation = validateFile(file);
    if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
        // ── Upload to Cloudinary ───────────────────────────
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const { url, publicId } = await uploadFileToCloudinary(buffer, file.name, file.type);

        const fileInfo = ACCEPTED_TYPES[file.type];
        const isPDF = file.type === 'application/pdf';

        // ── If PDF → process with pdf-parse (Direct instead of LangChain for stability) ──
        let pdfChunks = 0;
        if (isPDF) {
            try {
                // Dynamically load pdf-parse only when needed to avoid SSR/Server issues
                const pdf = require('pdf-parse');
                // Parse PDF text
                const pdfData = await pdf(buffer);
                const fullText = pdfData.text;

                // Split text into chunks
                const chunks = splitTextDirectly(fullText);
                pdfChunks = chunks.length;

                // Store embeddings in MongoDB
                const conn = await connectDB();
                if (!conn.connection.db) throw new Error('Database not initialized');
                const collection = conn.connection.db.collection('pdfdocs');

                const docsToInsert = await Promise.all(
                    chunks.map(async (content) => {
                        const embedding = await getEmbedding(content);
                        return {
                            userId: uid,
                            sessionId,
                            fileName: file.name,
                            cloudinaryUrl: url,
                            content,
                            embedding,
                            createdAt: new Date(),
                        };
                    })
                );

                if (docsToInsert.length > 0) {
                    await collection.insertMany(docsToInsert);
                }

                console.log(`[PDF] Processed ${pdfChunks} chunks for ${file.name}`);
            } catch (pdfErr: any) {
                console.error('[PDF Processing Error]', pdfErr);
            }
        }

        // ── Save to MongoDB chat ───────────────────────────
        await connectDB();
        await Chat.findOneAndUpdate(
            { sessionId, userId: uid },
            {
                $set: { userEmail: email },
                $setOnInsert: { title: `📎 ${file.name.slice(0, 40)}` },
                $push: {
                    messages: {
                        $each: [
                            {
                                role: 'user',
                                content: `Uploaded file: ${file.name}`,
                                fileUrl: url,
                                fileName: file.name,
                                fileType: fileInfo.ext,
                                fileSize: file.size,
                                publicId,
                                timestamp: new Date(),
                            },
                            {
                                role: 'assistant',
                                content: isPDF && pdfChunks > 0
                                    ? `📄 I've received and fully processed **${file.name}** (${(file.size / 1024).toFixed(1)} KB). I've indexed **${pdfChunks} chunks** from this PDF — you can now ask me anything about its content!`
                                    : `${fileInfo.icon} I've received **${file.name}** (${(file.size / 1024).toFixed(1)} KB). The file has been uploaded successfully!`,
                                timestamp: new Date(),
                            },
                        ],
                    },
                },
            },
            { upsert: true, returnDocument: 'after' }
        );

        return NextResponse.json({
            success: true,
            url,
            publicId,
            fileName: file.name,
            fileType: fileInfo.ext,
            fileSize: file.size,
            icon: fileInfo.icon,
            pdfChunks: isPDF ? pdfChunks : undefined,
        });

    } catch (err: any) {
        console.error('[Upload Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}