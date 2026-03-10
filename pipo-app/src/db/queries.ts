import { getDatabase } from './database';
import { Chat, Message, MessageStatus, QueuedMessage, MediaAttachment } from '../types';

// ─── Chat Queries ───

export async function getAllChats(): Promise<Chat[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    created_by: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>('SELECT * FROM chats WHERE deleted_at IS NULL ORDER BY updated_at DESC');

  return rows.map(mapChatRow);
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    created_by: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }>('SELECT * FROM chats WHERE id = ?', [chatId]);
  return row ? mapChatRow(row) : null;
}

export async function createChat(chat: Chat): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO chats (id, name, created_by, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)',
    [chat.id, chat.name, chat.createdBy, chat.createdAt, chat.updatedAt, chat.deletedAt]
  );
}

export async function updateChatTimestamp(chatId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE chats SET updated_at = ? WHERE id = ?', [Date.now(), chatId]);
}

// ─── Message Queries ───

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MessageRow>(
    'SELECT * FROM messages WHERE chat_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
    [chatId]
  );
  return rows.map(mapMessageRow);
}

export async function getLastMessageForChat(chatId: string): Promise<Message | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MessageRow>(
    'SELECT * FROM messages WHERE chat_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [chatId]
  );
  return row ? mapMessageRow(row) : null;
}

export async function createMessage(message: Message): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO messages (id, chat_id, sender_id, content, type, status, created_at, updated_at, deleted_at,
     media_uri, media_local_uri, compressed_local_uri, media_mime_type, media_duration, media_width, media_height,
     original_size_bytes, compressed_size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.chatId,
      message.senderId,
      message.content,
      message.type,
      message.status,
      message.createdAt,
      message.updatedAt,
      message.deletedAt,
      message.mediaUri ?? null,
      message.mediaLocalUri ?? null,
      message.compressedLocalUri ?? null,
      message.mediaMimeType ?? null,
      message.mediaDuration ?? null,
      message.mediaWidth ?? null,
      message.mediaHeight ?? null,
      message.originalSizeBytes ?? null,
      message.compressedSizeBytes ?? null,
    ]
  );
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE messages SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    Date.now(),
    messageId,
  ]);
}

// ─── Message Queue Queries ───

export async function enqueueMessage(item: QueuedMessage): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO message_queue (id, message_id, chat_id, retry_count, max_retries, next_retry_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [item.id, item.messageId, item.chatId, item.retryCount, item.maxRetries, item.nextRetryAt, item.createdAt]
  );
}

export async function dequeueMessage(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM message_queue WHERE id = ?', [id]);
}

export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    message_id: string;
    chat_id: string;
    retry_count: number;
    max_retries: number;
    next_retry_at: number;
    created_at: number;
  }>('SELECT * FROM message_queue WHERE next_retry_at <= ? ORDER BY created_at ASC', [Date.now()]);

  return rows.map((row) => ({
    id: row.id,
    messageId: row.message_id,
    chatId: row.chat_id,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    nextRetryAt: row.next_retry_at,
    createdAt: row.created_at,
  }));
}

export async function incrementQueueRetry(id: string): Promise<void> {
  const db = await getDatabase();
  const backoff = 5000; // 5 second base backoff
  await db.runAsync(
    `UPDATE message_queue
     SET retry_count = retry_count + 1,
         next_retry_at = ? + (retry_count + 1) * ?
     WHERE id = ?`,
    [Date.now(), backoff, id]
  );
}

export async function getFailedQueueItems(): Promise<QueuedMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    message_id: string;
    chat_id: string;
    retry_count: number;
    max_retries: number;
    next_retry_at: number;
    created_at: number;
  }>('SELECT * FROM message_queue WHERE retry_count >= max_retries');

  return rows.map((row) => ({
    id: row.id,
    messageId: row.message_id,
    chatId: row.chat_id,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    nextRetryAt: row.next_retry_at,
    createdAt: row.created_at,
  }));
}

// ─── Media Attachment Queries ───

export async function createMediaAttachment(attachment: MediaAttachment): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO media_attachments (id, message_id, original_storage_key, compressed_storage_key,
     local_original_uri, local_compressed_uri, mime_type, original_size_bytes, compressed_size_bytes,
     width, height, duration_seconds, upload_status, upload_progress, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attachment.id,
      attachment.messageId,
      attachment.originalStorageKey,
      attachment.compressedStorageKey,
      attachment.localOriginalUri,
      attachment.localCompressedUri,
      attachment.mimeType,
      attachment.originalSizeBytes,
      attachment.compressedSizeBytes,
      attachment.width,
      attachment.height,
      attachment.durationSeconds,
      attachment.uploadStatus,
      attachment.uploadProgress,
      attachment.createdAt,
    ]
  );
}

export async function updateMediaUploadStatus(
  id: string,
  status: MediaAttachment['uploadStatus'],
  progress: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE media_attachments SET upload_status = ?, upload_progress = ? WHERE id = ?',
    [status, progress, id]
  );
}

export async function getMediaAttachmentByMessageId(
  messageId: string
): Promise<MediaAttachment | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    message_id: string;
    original_storage_key: string | null;
    compressed_storage_key: string | null;
    local_original_uri: string;
    local_compressed_uri: string | null;
    mime_type: string;
    original_size_bytes: number;
    compressed_size_bytes: number | null;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    upload_status: string;
    upload_progress: number;
    created_at: number;
  }>('SELECT * FROM media_attachments WHERE message_id = ?', [messageId]);

  if (!row) return null;

  return {
    id: row.id,
    messageId: row.message_id,
    originalStorageKey: row.original_storage_key,
    compressedStorageKey: row.compressed_storage_key,
    localOriginalUri: row.local_original_uri,
    localCompressedUri: row.local_compressed_uri,
    mimeType: row.mime_type,
    originalSizeBytes: row.original_size_bytes,
    compressedSizeBytes: row.compressed_size_bytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    uploadStatus: row.upload_status as MediaAttachment['uploadStatus'],
    uploadProgress: row.upload_progress,
    createdAt: row.created_at,
  };
}

export async function getPendingMediaUploads(): Promise<MediaAttachment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    message_id: string;
    original_storage_key: string | null;
    compressed_storage_key: string | null;
    local_original_uri: string;
    local_compressed_uri: string | null;
    mime_type: string;
    original_size_bytes: number;
    compressed_size_bytes: number | null;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    upload_status: string;
    upload_progress: number;
    created_at: number;
  }>(
    "SELECT * FROM media_attachments WHERE upload_status IN ('pending', 'failed') ORDER BY created_at ASC"
  );

  return rows.map((row) => ({
    id: row.id,
    messageId: row.message_id,
    originalStorageKey: row.original_storage_key,
    compressedStorageKey: row.compressed_storage_key,
    localOriginalUri: row.local_original_uri,
    localCompressedUri: row.local_compressed_uri,
    mimeType: row.mime_type,
    originalSizeBytes: row.original_size_bytes,
    compressedSizeBytes: row.compressed_size_bytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    uploadStatus: row.upload_status as MediaAttachment['uploadStatus'],
    uploadProgress: row.upload_progress,
    createdAt: row.created_at,
  }));
}

// ─── Seed Data ───

export async function seedMockData(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM chats'
  );
  if (existing && existing.count > 0) return false;

  const now = Date.now();
  const HOUR = 3600000;
  const DAY = 86400000;

  await db.execAsync(`
    INSERT INTO chats (id, name, created_by, created_at, updated_at, deleted_at) VALUES
    ('chat-1', 'Emma''s Moments', '${userId}', ${now - 30 * DAY}, ${now - 2 * HOUR}, NULL),
    ('chat-2', 'Lucas''s First Year', '${userId}', ${now - 90 * DAY}, ${now - DAY}, NULL),
    ('chat-3', 'Family Memories', 'user-2', ${now - 60 * DAY}, ${now - 3 * DAY}, NULL);

    INSERT INTO messages (id, chat_id, sender_id, content, type, status, created_at, updated_at, deleted_at) VALUES
    ('msg-1-1', 'chat-1', '${userId}', 'Emma took her first steps today! 🎉', 'text', 'sent', ${now - 5 * DAY}, ${now - 5 * DAY}, NULL),
    ('msg-1-2', 'chat-1', 'user-2', 'Oh my god, that is amazing! I wish I was there!', 'text', 'sent', ${now - 5 * DAY + 600000}, ${now - 5 * DAY + 600000}, NULL),
    ('msg-1-3', 'chat-1', '${userId}', '', 'photo', 'sent', ${now - 3 * DAY}, ${now - 3 * DAY}, NULL),
    ('msg-1-4', 'chat-1', '${userId}', 'Her giggling at the park', 'audio', 'sent', ${now - 2 * DAY}, ${now - 2 * DAY}, NULL),
    ('msg-1-5', 'chat-1', 'user-2', 'Look at this video of her playing!', 'video', 'sent', ${now - 2 * HOUR}, ${now - 2 * HOUR}, NULL),
    ('msg-2-1', 'chat-2', '${userId}', 'Lucas smiled for the first time today', 'text', 'sent', ${now - 10 * DAY}, ${now - 10 * DAY}, NULL),
    ('msg-2-2', 'chat-2', '${userId}', '', 'photo', 'sent', ${now - DAY}, ${now - DAY}, NULL),
    ('msg-3-1', 'chat-3', 'user-2', 'Who wants to add memories from the family trip?', 'text', 'sent', ${now - 5 * DAY}, ${now - 5 * DAY}, NULL),
    ('msg-3-2', 'chat-3', '${userId}', 'Me! I have so many photos to share', 'text', 'sent', ${now - 3 * DAY}, ${now - 3 * DAY}, NULL);
  `);

  return true;
}

// ─── Row Mappers ───

interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  status: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  media_uri: string | null;
  media_local_uri: string | null;
  compressed_local_uri: string | null;
  media_mime_type: string | null;
  media_duration: number | null;
  media_width: number | null;
  media_height: number | null;
  original_size_bytes: number | null;
  compressed_size_bytes: number | null;
}

function mapChatRow(row: {
  id: string;
  name: string;
  created_by: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}): Chat {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    content: row.content,
    type: row.type as Message['type'],
    status: row.status as Message['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    mediaUri: row.media_uri ?? undefined,
    mediaLocalUri: row.media_local_uri ?? undefined,
    compressedLocalUri: row.compressed_local_uri ?? undefined,
    mediaMimeType: row.media_mime_type ?? undefined,
    mediaDuration: row.media_duration ?? undefined,
    mediaWidth: row.media_width ?? undefined,
    mediaHeight: row.media_height ?? undefined,
    originalSizeBytes: row.original_size_bytes ?? undefined,
    compressedSizeBytes: row.compressed_size_bytes ?? undefined,
  };
}
