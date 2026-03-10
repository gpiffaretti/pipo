import { Router, Response, NextFunction } from 'express';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../db';
import { chats, chatMembers, messages } from '../db/schema';
import { AuthenticatedRequest, requireAuth, resolveUser } from '../middleware/auth';
import { requireChatRole, requireChatMember } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createChatSchema, updateChatSchema } from '../validation/schemas';

const router = Router();

// POST /api/v1/chats - Create a new chat
router.post(
  '/',
  requireAuth(),
  resolveUser,
  validate(createChatSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;

      const [chat] = await db
        .insert(chats)
        .values({
          name,
          createdBy: req.userId!,
        })
        .returning();

      // Creator becomes owner
      await db.insert(chatMembers).values({
        chatId: chat.id,
        userId: req.userId!,
        role: 'owner',
      });

      res.status(201).json({ chat });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/chats - List user's chats
router.get(
  '/',
  requireAuth(),
  resolveUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberships = await db
        .select({
          chat: chats,
          role: chatMembers.role,
        })
        .from(chatMembers)
        .innerJoin(chats, eq(chatMembers.chatId, chats.id))
        .where(
          and(
            eq(chatMembers.userId, req.userId!),
            isNull(chatMembers.leftAt),
            isNull(chats.deletedAt)
          )
        )
        .orderBy(desc(chats.updatedAt));

      // Get last message for each chat
      const results = await Promise.all(
        memberships.map(async ({ chat, role }) => {
          const [lastMessage] = await db
            .select()
            .from(messages)
            .where(and(eq(messages.chatId, chat.id), isNull(messages.deletedAt)))
            .orderBy(desc(messages.createdAt))
            .limit(1);

          return { ...chat, role, lastMessage: lastMessage ?? null };
        })
      );

      res.json({ chats: results });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/chats/:chatId - Get a single chat
router.get(
  '/:chatId',
  requireAuth(),
  resolveUser,
  requireChatMember(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [chat] = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, req.params.chatId), isNull(chats.deletedAt)))
        .limit(1);

      if (!chat) {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      const members = await db
        .select()
        .from(chatMembers)
        .where(and(eq(chatMembers.chatId, chat.id), isNull(chatMembers.leftAt)));

      res.json({ chat, members });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/chats/:chatId - Update chat
router.patch(
  '/:chatId',
  requireAuth(),
  resolveUser,
  requireChatRole('owner', 'admin'),
  validate(updateChatSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;

      const [updated] = await db
        .update(chats)
        .set({
          ...(name && { name }),
          updatedAt: new Date(),
        })
        .where(eq(chats.id, req.params.chatId))
        .returning();

      res.json({ chat: updated });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/chats/:chatId - Soft-delete chat (owner only)
router.delete(
  '/:chatId',
  requireAuth(),
  resolveUser,
  requireChatRole('owner'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await db
        .update(chats)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(chats.id, req.params.chatId));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
