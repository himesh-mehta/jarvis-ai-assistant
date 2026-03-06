import cloudinary from './cloudinary';

export const ACCEPTED_TYPES: Record<string, { ext: string; icon: string; label: string }> = {
  'application/pdf':                                                      { ext: 'pdf',  icon: '📄', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: '📝', label: 'Word' },
  'text/plain':                                                           { ext: 'txt',  icon: '📃', label: 'Text' },
  'text/csv':                                                             { ext: 'csv',  icon: '📊', label: 'CSV' },
  'application/csv':                                                      { ext: 'csv',  icon: '📊', label: 'CSV' },
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_TYPES[file.type]) {
    return { valid: false, error: 'File type not supported. Use PDF, DOCX, TXT, or CSV.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 20MB.' };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadFileToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder:        'jarvis-files',
        resource_type: 'raw',              // raw for non-image files
        public_id:     `${Date.now()}-${filename.replace(/\s+/g, '_')}`,
        format:        ACCEPTED_TYPES[mimeType]?.ext,
      },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(buffer);
  });
}