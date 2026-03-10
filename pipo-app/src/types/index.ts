export type MessageType = 'text' | 'audio' | 'photo' | 'video';

export type MessageStatus = 'pending' | 'sent' | 'failed';

export type ChatRole = 'owner' | 'admin' | 'member';

export interface Chat {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  mediaUri?: string;
  mediaLocalUri?: string;
  compressedLocalUri?: string;
  mediaMimeType?: string;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: ChatRole;
  joinedAt: number;
  leftAt: number | null;
}

export interface QueuedMessage {
  id: string;
  messageId: string;
  chatId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
  createdAt: number;
}

export interface MediaAttachment {
  id: string;
  messageId: string;
  originalStorageKey: string | null;
  compressedStorageKey: string | null;
  localOriginalUri: string;
  localCompressedUri: string | null;
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress: number;
  createdAt: number;
}

export type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; chatName: string };
};
