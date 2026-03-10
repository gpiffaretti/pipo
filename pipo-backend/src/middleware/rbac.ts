import { Response, NextFunction } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { chatMembers } from '../db/schema';
import { AuthenticatedRequest } from './auth';

export type ChatRole = 'owner' | 'admin' | 'member';

const ROLE_HIERARCHY: Record<ChatRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function requireChatRole(...allowedRoles: ChatRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      const chatId = req.params.chatId as string;

      if (!userId || !chatId) {
        res.status(400).json({ error: 'Missing user or chat identifier' });
        return;
      }

      const [membership] = await db
        .select()
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.chatId, chatId),
            eq(chatMembers.userId, userId),
            isNull(chatMembers.leftAt)
          )
        )
        .limit(1);

      if (!membership) {
        res.status(403).json({ error: 'You are not a member of this chat' });
        return;
      }

      const userRole = membership.role as ChatRole;
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireChatMember() {
  return requireChatRole('owner', 'admin', 'member');
}

export function canManageRole(actorRole: ChatRole, targetCurrentRole: ChatRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetCurrentRole];
}
