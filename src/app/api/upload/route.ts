import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { connectDB } from '@/app/lib/mongodb';
import Chat from '@/app/lib/models/ChatModel';
import { validateFile, uploadFileToCloudinary, ACCEPTED_TYPES } from '@/lib/fileUpload';

export async function POST(req: NextRequest) {
  // ── Verify Firebase Token ──────────────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid = '', email = '';
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid   = decoded.uid;
    email = decoded.email ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // ── Parse FormData ─────────────────────────────────────────
  const formData  = await req.formData();
  const file      = formData.get('file') as File;
  const sessionId = formData.get('sessionId') as string;

  if (!file)      return NextResponse.json({ error: 'No file provided' },  { status: 400 });
  if (!sessionId) return NextResponse.json({ error: 'No sessionId provided' }, { status: 400 });

  // ── Validate file ──────────────────────────────────────────
  const validation = validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    // ── Upload to Cloudinary ───────────────────────────────
    const bytes     = await file.arrayBuffer();
    const buffer    = Buffer.from(bytes);
    const { url, publicId } = await uploadFileToCloudinary(buffer, file.name, file.type);

    const fileInfo = ACCEPTED_TYPES[file.type];

    // ── Save to MongoDB ────────────────────────────────────
    await connectDB();
    await Chat.findOneAndUpdate(
      { sessionId, userId: uid },
      {
        $set: { userEmail: email },
        $setOnInsert: { title: `📎 ${file.name.slice(0, 40)}` },
        $push: {
          messages: {
            $each: [
              // User message showing the file
              {
                role:      'user',
                content:   `Uploaded file: ${file.name}`,
                fileUrl:   url,
                fileName:  file.name,
                fileType:  fileInfo.ext,
                fileSize:  file.size,
                publicId,
                timestamp: new Date(),
              },
              // AI acknowledgment
              {
                role:      'assistant',
                content:   `${fileInfo.icon} I've received **${file.name}** (${(file.size / 1024).toFixed(1)} KB). The file has been uploaded successfully! Once LangChain is set up, I'll be able to read and answer questions about its content. For now, feel free to ask me anything else!`,
                timestamp: new Date(),
              },
            ],
          },
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success:  true,
      url,
      publicId,
      fileName: file.name,
      fileType: fileInfo.ext,
      fileSize: file.size,
      icon:     fileInfo.icon,
    });

  } catch (err: any) {
    console.error('[Upload Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}