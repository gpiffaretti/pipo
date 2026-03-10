import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

// Max file sizes
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/mov',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/wav',
];

export function validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported file type: ${mimeType}` };
  }

  if (mimeType.startsWith('image/') && fileSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image exceeds maximum size of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` };
  }
  if (mimeType.startsWith('video/') && fileSize > MAX_VIDEO_SIZE) {
    return { valid: false, error: `Video exceeds maximum size of ${MAX_VIDEO_SIZE / (1024 * 1024)}MB` };
  }
  if (mimeType.startsWith('audio/') && fileSize > MAX_AUDIO_SIZE) {
    return { valid: false, error: `Audio exceeds maximum size of ${MAX_AUDIO_SIZE / (1024 * 1024)}MB` };
  }

  return { valid: true };
}

export function generateStorageKey(userId: string, type: 'original' | 'compressed', fileName: string): string {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${type}/${userId}/${timestamp}_${safeFileName}`;
}

export async function getUploadPresignedUrl(
  storageKey: string,
  mimeType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ContentType: mimeType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getDownloadPresignedUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function deleteObject(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  await r2Client.send(command);
}

export { r2Client, BUCKET };
