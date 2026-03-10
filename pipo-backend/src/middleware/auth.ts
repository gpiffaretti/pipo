import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export { clerkMiddleware, requireAuth };

export interface AuthenticatedRequest extends Request {
  userId?: string; // Internal DB user ID
  clerkUserId?: string;
}

export async function resolveUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.clerkUserId = auth.userId;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, auth.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'User not found. Please complete registration first.' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}
