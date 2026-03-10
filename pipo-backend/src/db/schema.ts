import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  uuid,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  revenuecatCustomerId: text('revenuecat_customer_id'),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  chatMembers: many(chatMembers),
  messages: many(messages),
  createdChats: many(chats),
  invites: many(invites),
  publicShareLinks: many(publicShareLinks),
  usageTracking: many(usageTracking),
}));

// ─── Chats ───

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, { fields: [chats.createdBy], references: [users.id] }),
  members: many(chatMembers),
  messages: many(messages),
  invites: many(invites),
}));

// ─── Chat Members ───

export const chatMembers = pgTable(
  'chat_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    leftAt: timestamp('left_at'),
  },
  (table) => ({
    chatUserIdx: uniqueIndex('chat_members_chat_user_idx').on(table.chatId, table.userId),
  })
);

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, { fields: [chatMembers.chatId], references: [chats.id] }),
  user: one(users, { fields: [chatMembers.userId], references: [users.id] }),
}));

// ─── Messages ───

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull().default(''),
    type: text('type').notNull().default('text'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  })
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  mediaAttachments: many(mediaAttachments),
}));

// ─── Media Attachments ───

export const mediaAttachments = pgTable(
  'media_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id),
    originalStorageKey: text('original_storage_key'),
    compressedStorageKey: text('compressed_storage_key'),
    mimeType: text('mime_type').notNull(),
    originalSizeBytes: integer('original_size_bytes').notNull().default(0),
    compressedSizeBytes: integer('compressed_size_bytes'),
    width: integer('width'),
    height: integer('height'),
    durationSeconds: real('duration_seconds'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    messageIdIdx: index('media_attachments_message_id_idx').on(table.messageId),
  })
);

export const mediaAttachmentsRelations = relations(mediaAttachments, ({ one, many }) => ({
  message: one(messages, { fields: [mediaAttachments.messageId], references: [messages.id] }),
  publicShareLinks: many(publicShareLinks),
}));

// ─── Invites ───

export const invites = pgTable(
  'invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    maxUses: integer('max_uses').notNull().default(1),
    usedCount: integer('used_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('invites_token_idx').on(table.token),
  })
);

export const invitesRelations = relations(invites, ({ one }) => ({
  chat: one(chats, { fields: [invites.chatId], references: [chats.id] }),
  creator: one(users, { fields: [invites.createdBy], references: [users.id] }),
}));

// ─── Public Share Links ───

export const publicShareLinks = pgTable(
  'public_share_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mediaAttachmentId: uuid('media_attachment_id')
      .notNull()
      .references(() => mediaAttachments.id),
    shareToken: text('share_token').notNull().unique(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    accessCount: integer('access_count').notNull().default(0),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    shareTokenIdx: uniqueIndex('public_share_links_share_token_idx').on(table.shareToken),
  })
);

export const publicShareLinksRelations = relations(publicShareLinks, ({ one }) => ({
  mediaAttachment: one(mediaAttachments, {
    fields: [publicShareLinks.mediaAttachmentId],
    references: [mediaAttachments.id],
  }),
  creator: one(users, { fields: [publicShareLinks.createdBy], references: [users.id] }),
}));

// ─── Usage Tracking ───

export const usageTracking = pgTable(
  'usage_tracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    messagesSent: integer('messages_sent').notNull().default(0),
    mediaUploadedMb: real('media_uploaded_mb').notNull().default(0),
    storageUsedMb: real('storage_used_mb').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userPeriodIdx: index('usage_tracking_user_period_idx').on(table.userId, table.periodStart),
  })
);

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, { fields: [usageTracking.userId], references: [users.id] }),
}));
