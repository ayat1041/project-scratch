/**
 * File Upload API Route — Secure File Validation & Upload
 * 
 * This endpoint handles file uploads with comprehensive security validation before
 * forwarding to the backend storage service (Cloudflare R2).
 * 
 * Process Flow:
 * 1. Extract file and folder from incoming FormData
 * 2. Validate file size (max 10MB)
 * 3. Validate MIME type against allowlist (images, PDFs, Office docs)
 * 4. Validate file extension against allowlist
 * 5. Read file content into buffer and validate magic bytes (file signature)
 *    - Prevents malicious files disguised with fake extensions
 *    - Ensures actual file content matches declared MIME type
 * 6. Generate unique, secure filename (timestamp + UUID + validated extension)
 * 7. Reconstruct File object with validated buffer and safe filename
 * 8. Forward validated file to backend upload service with R2 credentials
 * 9. Return backend response to client
 * 
 * Security Features:
 * - MIME type allowlist (no executable files)
 * - Extension allowlist validation
 * - Magic byte verification (content-based validation)
 * - File size limits
 * - Unique filename generation (prevents overwrites & info leaks)
 * - No original filename exposure in storage
 * 
 * Supported Formats:
 * - Images: JPEG, PNG, GIF, WebP
 * - Documents: PDF, DOC, DOCX, PPT, PPTX
 */
import { NextRequest, NextResponse } from 'next/server';

// Allowlist of permitted MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint', // PPT
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
]);

// MIME to extension mapping
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
};

// Allowlist of permitted extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf',
  '.pptx', '.ppt', '.docx', '.doc',
]);

// Magic byte signatures for validation
const FILE_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // Office formats (ZIP-based: PK header)
  { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', bytes: [0x50, 0x4B, 0x03, 0x04] },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4B, 0x03, 0x04] },
  // Legacy Office formats
  { mime: 'application/vnd.ms-powerpoint', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
  { mime: 'application/msword', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

async function validateMagicBytes(buffer: Uint8Array, declaredMime: string): Promise<boolean> {
  const sig = FILE_SIGNATURES.find(s => s.mime === declaredMime);
  if (!sig) return false;

  const offset = sig.offset ?? 0;
  if (buffer.length < offset + sig.bytes.length) return false;

  return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
}

function generateSafeFilename(file: File): string {
  const originalName = file.name || '';
  const rawExt = originalName.includes('.')
    ? originalName.split('.').pop() || ''
    : '';
  const normalizedExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const extension = normalizedExt || MIME_EXTENSION_MAP[file.type] || 'bin';

  return `upload_${Date.now()}_${crypto.randomUUID()}.${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('file') as File | null;
    const folder = incomingFormData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!folder) {
      return NextResponse.json({ error: 'Missing folder.' }, { status: 400 });
    }

    // Security validation layer

    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size (10MB).' },
        { status: 400 }
      );
    }

    // 2. Check MIME type against allowlist
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'File type not permitted.' },
        { status: 400 }
      );
    }

    // 3. Check file extension against allowlist
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'File extension not permitted.' },
        { status: 400 }
      );
    }

    // 4. Validate magic bytes (actual file content)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const isValidSignature = await validateMagicBytes(buffer, file.type);

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'File content does not match its declared type.' },
        { status: 400 }
      );
    }

    // 5. Generate secure unique filename
    const safeFilename = generateSafeFilename(file);

    // 6. Reconstruct File object with validated buffer and safe filename
    const safeFile = new File([buffer], safeFilename, { type: file.type });

    // Forward to backend
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('bucketName', process.env.CLOUDFLARE_R2_BUCKET_NAME!);
    formData.append('file', safeFile);
    formData.append('name', safeFilename);

    const response = await fetch(`${process.env.UPLOAD_FILE_API_URL}/v1/file`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        access_key: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secret_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(responseData, { status: response.status });
    }

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}