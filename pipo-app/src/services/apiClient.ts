import { API_BASE_URL } from '../config/constants';

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(fn: () => Promise<string | null>): void {
  getTokenFn = fn;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, body.error || 'Request failed', body.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── User Endpoints ───

export async function registerUser(email: string, displayName: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/users/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, displayName }),
  });
  return handleResponse<{ user: ApiUser }>(res);
}

export async function getCurrentUser() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, { headers });
  return handleResponse<{ user: ApiUser; usage: ApiUsage | null }>(res);
}

export async function updateCurrentUser(data: { displayName?: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ user: ApiUser }>(res);
}

// ─── Chat Endpoints ───

export async function createChat(name: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  return handleResponse<{ chat: ApiChat }>(res);
}

export async function listChats() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats`, { headers });
  return handleResponse<{ chats: ApiChatWithLastMessage[] }>(res);
}

export async function getChat(chatId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}`, { headers });
  return handleResponse<{ chat: ApiChat; members: ApiChatMember[] }>(res);
}

export async function updateChat(chatId: string, data: { name?: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ chat: ApiChat }>(res);
}

export async function deleteChat(chatId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<void>(res);
}

// ─── Message Endpoints ───

export async function sendMessageToServer(
  chatId: string,
  content: string,
  type: string = 'text'
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, type }),
  });
  return handleResponse<{ message: ApiMessage }>(res);
}

export async function listMessages(chatId: string, limit = 50, cursor?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(
    `${API_BASE_URL}/api/v1/chats/${chatId}/messages?${params}`,
    { headers }
  );
  return handleResponse<{
    messages: ApiMessageWithMedia[];
    pagination: { hasMore: boolean; nextCursor: string | null };
  }>(res);
}

export async function deleteMessage(chatId: string, messageId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/v1/chats/${chatId}/messages/${messageId}`,
    { method: 'DELETE', headers }
  );
  return handleResponse<void>(res);
}

// ─── Media Endpoints ───

export async function requestUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/media/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  });
  return handleResponse<{ uploadUrl: string; storageKey: string }>(res);
}

export async function completeUpload(data: {
  messageId: string;
  storageKey: string;
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes?: number;
  compressedStorageKey?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/media/upload-complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ attachment: ApiMediaAttachment }>(res);
}

export async function getDownloadUrl(
  mediaId: string,
  quality: 'original' | 'compressed' = 'compressed'
) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/v1/media/${mediaId}/download-url?quality=${quality}`,
    { headers }
  );
  return handleResponse<{ downloadUrl: string; quality: string; mimeType: string }>(res);
}

export async function createShareLink(mediaId: string, expiresInHours: number = 24) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/media/${mediaId}/share`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expiresInHours }),
  });
  return handleResponse<{ shareLink: ApiShareLink }>(res);
}

export async function revokeShareLink(shareId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/media/share/${shareId}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<void>(res);
}

// ─── API Types ───

export interface ApiUser {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  revenuecatCustomerId: string | null;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUsage {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  messagesSent: number;
  mediaUploadedMb: number;
  storageUsedMb: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiChat {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApiChatWithLastMessage extends ApiChat {
  role: string;
  lastMessage: ApiMessage | null;
}

export interface ApiChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface ApiMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApiMediaAttachment {
  id: string;
  messageId: string;
  originalStorageKey: string | null;
  compressedStorageKey: string | null;
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface ApiMessageWithMedia extends ApiMessage {
  mediaAttachments: ApiMediaAttachment[];
}

export interface ApiShareLink {
  id: string;
  mediaAttachmentId: string;
  shareToken: string;
  createdBy: string;
  expiresAt: string;
  accessCount: number;
  revokedAt: string | null;
  createdAt: string;
  url: string;
}
