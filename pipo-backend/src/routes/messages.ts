import { Router, Response, NextFunction } from 'express';
import { eq, and, isNull, desc, lt } from 'drizzle-orm';
import { db } from '../db';
import { messages, chats, mediaAttachments, usageTracking } from '../db/schema';
import { AuthenticatedRequest, requireAuth, resolveUser } from '../middleware/auth';
import { requireChatMember } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createMessageSchema, paginationSchema } from '../validation/schemas';

const router = Router();

// POST /api/v1/chats/:chatId/messages - Send a message
router.post(
  '/:chatId/messages',
  requireAuth(),
  resolveUser,
  requireChatMember(),
  validate(createMessageSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chatId = req.params.chatId as string;
      const { content, type } = req.body;

      const [message] = await db
        .insert(messages)
        .values({
          chatId,
          senderId: req.userId!,
          content,
          type,
        })
        .returning();

      // Update chat timestamp
      await db
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, chatId));

      // Increment usage tracking
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      await db
        .update(usageTracking)
        .set({
          messagesSent: db.$count(
            messages,
            and(eq(messages.senderId, req.userId!), eq(messages.chatId, chatId))
          ) as unknown as number,
          updatedAt: new Date(),
        })
        .where(eq(usageTracking.userId, req.userId!));

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/chats/:chatId/messages - List messages with cursor pagination
router.get(
  '/:chatId/messages',
  requireAuth(),
  resolveUser,
  requireChatMember(),
  validate(paginationSchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chatId = req.params.chatId as string;
      const { limit, cursor } = req.query as unknown as { limit: number; cursor?: string };

      const conditions = [eq(messages.chatId, chatId), isNull(messages.deletedAt)];

      if (cursor) {
        conditions.push(lt(messages.createdAt, new Date(cursor)));
      }

      const msgs = await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(limit + 1);

      const hasMore = msgs.length > limit;
      const results = hasMore ? msgs.slice(0, limit) : msgs;
      const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

      // Fetch media attachments for messages
      const messageIds = results.map((m) => m.id);
      let attachments: (typeof mediaAttachments.$inferSelect)[] = [];
      if (messageIds.length > 0) {
        attachments = await db
          .select()
          .from(mediaAttachments)
          .where(
            eq(mediaAttachments.messageId, messageIds[0]) // Will be enhanced with inArray for multiple
          );
      }

      const messagesWithMedia = results.map((msg) => ({
        ...msg,
        mediaAttachments: attachments.filter((a) => a.messageId === msg.id),
      }));

      res.json({
        messages: messagesWithMedia.reverse(), // Return in chronological order
        pagination: { hasMore, nextCursor },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/chats/:chatId/messages/:messageId - Get single message
router.get(
  '/:chatId/messages/:messageId',
  requireAuth(),
  resolveUser,
  requireChatMember(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messageId = req.params.messageId as string;

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
        .limit(1);

      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      const attachmentsList = await db
        .select()
        .from(mediaAttachments)
        .where(eq(mediaAttachments.messageId, messageId));

      res.json({ message: { ...message, mediaAttachments: attachmentsList } });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/chats/:chatId/messages/:messageId - Soft-delete own message
router.delete(
  '/:chatId/messages/:messageId',
  requireAuth(),
  resolveUser,
  requireChatMember(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messageId = req.params.messageId as string;

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      if (message.senderId !== req.userId) {
        res.status(403).json({ error: 'You can only delete your own messages' });
        return;
      }

      await db
        .update(messages)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(messages.id, messageId));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
