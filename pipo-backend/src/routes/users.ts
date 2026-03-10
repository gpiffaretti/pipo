import { Router, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, usageTracking } from '../db/schema';
import { AuthenticatedRequest, requireAuth, resolveUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validation/schemas';

const router = Router();

// POST /api/v1/users/register - Create user after Clerk sign-up
router.post(
  '/register',
  requireAuth(),
  validate(createUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      if (!auth?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, auth.userId))
        .limit(1);

      if (existing.length > 0) {
        res.status(200).json({ user: existing[0] });
        return;
      }

      const { email, displayName } = req.body;

      const [newUser] = await db
        .insert(users)
        .values({
          clerkUserId: auth.userId,
          email,
          displayName,
        })
        .returning();

      // Initialize usage tracking for current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      await db.insert(usageTracking).values({
        userId: newUser.id,
        periodStart,
        periodEnd,
      });

      res.status(201).json({ user: newUser });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/users/me - Get current user profile
router.get(
  '/me',
  requireAuth(),
  resolveUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.userId!))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get current usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [usage] = await db
        .select()
        .from(usageTracking)
        .where(eq(usageTracking.userId, req.userId!))
        .limit(1);

      res.json({ user, usage: usage ?? null });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/users/me - Update current user profile
router.patch(
  '/me',
  requireAuth(),
  resolveUser,
  validate(updateUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { displayName } = req.body;

      const [updated] = await db
        .update(users)
        .set({
          ...(displayName && { displayName }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.userId!))
        .returning();

      res.json({ user: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
