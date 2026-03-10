import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getDatabase } from '../db/database';
import {
  getAllChats,
  getMessagesByChatId,
  getLastMessageForChat,
  createChat,
  createMessage,
  updateChatTimestamp,
  updateMessageStatus,
  seedMockData,
} from '../db/queries';
import { Chat, Message, MessageStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { messageQueueService } from '../services/messageQueue';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    async function init() {
      await getDatabase();
      // Seed mock data using Clerk user ID or fallback
      await seedMockData(userId ?? 'user-1');
      setIsReady(true);
    }
    init();
  }, [userId]);

  return { isReady };
}

export function useChatList() {
  const [chats, setChats] = useState<(Chat & { lastMessage?: Message })[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  const loadChats = useCallback(async () => {
    try {
      const allChats = await getAllChats();
      const chatsWithLastMessage = await Promise.all(
        allChats.map(async (chat) => {
          const lastMessage = await getLastMessageForChat(chat.id);
          return { ...chat, lastMessage: lastMessage ?? undefined };
        })
      );
      setChats(chatsWithLastMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const addChat = useCallback(
    async (name: string) => {
      const now = Date.now();
      const chat: Chat = {
        id: uuidv4(),
        name,
        createdBy: userId ?? 'user-1',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await createChat(chat);
      await loadChats();
      return chat;
    },
    [loadChats]
  );

  return { chats, loading, refresh: loadChats, addChat };
}

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getMessagesByChatId(chatId);
      setMessages(msgs);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadMessages();

    const removeListener = messageQueueService.addListener((_event, _messageId) => {
      loadMessages();
    });

    return removeListener;
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      type: Message['type'] = 'text',
      mediaProps?: Partial<Message>
    ) => {
      const now = Date.now();
      const message: Message = {
        id: uuidv4(),
        chatId,
        senderId: userId ?? 'user-1',
        content,
        type,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        ...mediaProps,
      };

      await createMessage(message);
      await updateChatTimestamp(chatId);
      setMessages((prev) => [...prev, message]);

      await messageQueueService.enqueue(message.id, chatId);
    },
    [chatId]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      await updateMessageStatus(messageId, 'pending');
      await messageQueueService.enqueue(messageId, chatId);
      await loadMessages();
    },
    [chatId, loadMessages]
  );

  return { messages, loading, refresh: loadMessages, sendMessage, retryMessage };
}
