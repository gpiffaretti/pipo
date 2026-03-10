import { Chat, Message } from '../types';

const NOW = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

export const CURRENT_USER_ID = 'user-1';

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-1',
    name: "Emma's Moments",
    createdBy: CURRENT_USER_ID,
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW - 2 * HOUR,
    deletedAt: null,
  },
  {
    id: 'chat-2',
    name: "Lucas's First Year",
    createdBy: CURRENT_USER_ID,
    createdAt: NOW - 90 * DAY,
    updatedAt: NOW - DAY,
    deletedAt: null,
  },
  {
    id: 'chat-3',
    name: 'Family Memories',
    createdBy: 'user-2',
    createdAt: NOW - 60 * DAY,
    updatedAt: NOW - 3 * DAY,
    deletedAt: null,
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1-1',
      chatId: 'chat-1',
      senderId: CURRENT_USER_ID,
      content: 'Emma took her first steps today! 🎉',
      type: 'text',
      status: 'sent',
      createdAt: NOW - 5 * DAY,
      updatedAt: NOW - 5 * DAY,
      deletedAt: null,
    },
    {
      id: 'msg-1-2',
      chatId: 'chat-1',
      senderId: 'user-2',
      content: 'Oh my god, that is amazing! I wish I was there!',
      type: 'text',
      status: 'sent',
      createdAt: NOW - 5 * DAY + 600000,
      updatedAt: NOW - 5 * DAY + 600000,
      deletedAt: null,
    },
    {
      id: 'msg-1-3',
      chatId: 'chat-1',
      senderId: CURRENT_USER_ID,
      content: '',
      type: 'photo',
      status: 'sent',
      createdAt: NOW - 3 * DAY,
      updatedAt: NOW - 3 * DAY,
      deletedAt: null,
      mediaUri: 'https://picsum.photos/400/300',
      mediaLocalUri: null as unknown as string,
      mediaWidth: 400,
      mediaHeight: 300,
    },
    {
      id: 'msg-1-4',
      chatId: 'chat-1',
      senderId: CURRENT_USER_ID,
      content: 'Her giggling at the park',
      type: 'audio',
      status: 'sent',
      createdAt: NOW - 2 * DAY,
      updatedAt: NOW - 2 * DAY,
      deletedAt: null,
      mediaDuration: 15,
    },
    {
      id: 'msg-1-5',
      chatId: 'chat-1',
      senderId: 'user-2',
      content: 'Look at this video of her playing!',
      type: 'video',
      status: 'sent',
      createdAt: NOW - 2 * HOUR,
      updatedAt: NOW - 2 * HOUR,
      deletedAt: null,
      mediaUri: 'https://example.com/video.mp4',
      mediaDuration: 30,
      mediaWidth: 1920,
      mediaHeight: 1080,
    },
  ],
  'chat-2': [
    {
      id: 'msg-2-1',
      chatId: 'chat-2',
      senderId: CURRENT_USER_ID,
      content: "Lucas smiled for the first time today",
      type: 'text',
      status: 'sent',
      createdAt: NOW - 10 * DAY,
      updatedAt: NOW - 10 * DAY,
      deletedAt: null,
    },
    {
      id: 'msg-2-2',
      chatId: 'chat-2',
      senderId: CURRENT_USER_ID,
      content: '',
      type: 'photo',
      status: 'sent',
      createdAt: NOW - DAY,
      updatedAt: NOW - DAY,
      deletedAt: null,
      mediaUri: 'https://picsum.photos/300/400',
      mediaWidth: 300,
      mediaHeight: 400,
    },
  ],
  'chat-3': [
    {
      id: 'msg-3-1',
      chatId: 'chat-3',
      senderId: 'user-2',
      content: 'Who wants to add memories from the family trip?',
      type: 'text',
      status: 'sent',
      createdAt: NOW - 5 * DAY,
      updatedAt: NOW - 5 * DAY,
      deletedAt: null,
    },
    {
      id: 'msg-3-2',
      chatId: 'chat-3',
      senderId: CURRENT_USER_ID,
      content: 'Me! I have so many photos to share',
      type: 'text',
      status: 'sent',
      createdAt: NOW - 3 * DAY,
      updatedAt: NOW - 3 * DAY,
      deletedAt: null,
    },
  ],
};

export function getMockChatsWithLastMessage(): (Chat & {
  lastMessage?: Message;
})[] {
  return MOCK_CHATS.map((chat) => {
    const messages = MOCK_MESSAGES[chat.id] || [];
    const lastMessage = messages[messages.length - 1];
    return { ...chat, lastMessage };
  });
}
