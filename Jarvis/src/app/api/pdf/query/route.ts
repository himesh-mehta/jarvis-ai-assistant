import "@/lib/serverPolyfills";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY!}`,
      },
      body: JSON.stringify({
        inputs: text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[Embeddings Error]", data);
    throw new Error(data?.error || "Failed to get embedding from Hugging Face");
  }

  if (!Array.isArray(data)) {
    console.error("[Embeddings Error] Unexpected response:", data);
    throw new Error("Unexpected embedding response from Hugging Face");
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { question, userId } = await req.json();

    if (!question || !userId) {
      return NextResponse.json(
        { error: "question and userId are required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();
    if (!conn.connection.db) throw new Error("Database not initialized");

    const collection = conn.connection.db.collection("pdfdocs");

    const questionEmbedding = await getEmbedding(question);

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
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
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    if (!results.length) {
      return NextResponse.json({ context: "", sources: [] });
    }

    const context = results.map((r: any) => r.content).join("\n\n");
    const sources = [...new Set(results.map((r: any) => r.fileName))];

    return NextResponse.json({ context, sources });
  } catch (err: any) {
    console.error("[PDF Query Error]", err);
    return NextResponse.json(
      { error: err.message || "PDF query failed" },
      { status: 500 }
    );
  }
}