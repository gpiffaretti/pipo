import { z } from 'zod';

// ─── User Schemas ───

export const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
});

// ─── Chat Schemas ───

export const createChatSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// ─── Message Schemas ───

export const createMessageSchema = z.object({
  content: z.string().default(''),
  type: z.enum(['text', 'audio', 'photo', 'video']).default('text'),
});

// ─── Media Schemas ───

export const requestUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  messageId: z.string().uuid().optional(),
});

export const completeUploadSchema = z.object({
  messageId: z.string().uuid(),
  storageKey: z.string().min(1),
  mimeType: z.string().min(1),
  originalSizeBytes: z.number().positive(),
  compressedSizeBytes: z.number().positive().optional(),
  compressedStorageKey: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  durationSeconds: z.number().nonnegative().optional(),
});

export const createShareLinkSchema = z.object({
  expiresInHours: z.number().min(1).max(24).default(24),
});

// ─── Pagination ───

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
