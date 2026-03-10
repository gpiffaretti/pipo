import { Router, Response, NextFunction } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { mediaAttachments, publicShareLinks, messages, usageTracking } from '../db/schema';
import { AuthenticatedRequest, requireAuth, resolveUser } from '../middleware/auth';
import { requireChatMember } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  requestUploadUrlSchema,
  completeUploadSchema,
  createShareLinkSchema,
} from '../validation/schemas';
import {
  validateFile,
  generateStorageKey,
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
} from '../services/r2';

const router = Router();

// POST /api/v1/media/upload-url - Get presigned URL for uploading
router.post(
  '/upload-url',
  requireAuth(),
  resolveUser,
  validate(requestUploadUrlSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName, mimeType, fileSize } = req.body;

      const validation = validateFile(mimeType, fileSize);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const storageKey = generateStorageKey(req.userId!, 'original', fileName);
      const uploadUrl = await getUploadPresignedUrl(storageKey, mimeType);

      res.json({ uploadUrl, storageKey });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/media/upload-complete - Confirm upload and create attachment record
router.post(
  '/upload-complete',
  requireAuth(),
  resolveUser,
  validate(completeUploadSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        messageId,
        storageKey,
        mimeType,
        originalSizeBytes,
        compressedSizeBytes,
        compressedStorageKey,
        width,
        height,
        durationSeconds,
      } = req.body;

      // Verify the message exists and belongs to the user
      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.senderId, req.userId!)))
        .limit(1);

      if (!message) {
        res.status(404).json({ error: 'Message not found or not yours' });
        return;
      }

      const [attachment] = await db
        .insert(mediaAttachments)
        .values({
          messageId,
          originalStorageKey: storageKey,
          compressedStorageKey: compressedStorageKey ?? null,
          mimeType,
          originalSizeBytes,
          compressedSizeBytes: compressedSizeBytes ?? null,
          width: width ?? null,
          height: height ?? null,
          durationSeconds: durationSeconds ?? null,
        })
        .returning();

      // Update usage tracking - add uploaded MB
      const uploadedMb = originalSizeBytes / (1024 * 1024);
      await db.execute(
        `UPDATE usage_tracking SET media_uploaded_mb = media_uploaded_mb + ${uploadedMb}, storage_used_mb = storage_used_mb + ${uploadedMb}, updated_at = NOW() WHERE user_id = '${req.userId}'`
      );

      res.status(201).json({ attachment });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/media/:id/download-url - Get presigned download URL
router.get(
  '/:id/download-url',
  requireAuth(),
  resolveUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const quality = (req.query.quality as string) || 'compressed';

      const [attachment] = await db
        .select()
        .from(mediaAttachments)
        .where(eq(mediaAttachments.id, id))
        .limit(1);

      if (!attachment) {
        res.status(404).json({ error: 'Media attachment not found' });
        return;
      }

      let storageKey: string | null;
      if (quality === 'original') {
        storageKey = attachment.originalStorageKey;
      } else {
        storageKey = attachment.compressedStorageKey ?? attachment.originalStorageKey;
      }

      if (!storageKey) {
        res.status(404).json({ error: 'Media file not available' });
        return;
      }

      const downloadUrl = await getDownloadPresignedUrl(storageKey);
      res.json({ downloadUrl, quality, mimeType: attachment.mimeType });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/media/:id/share - Generate a public share link
router.post(
  '/:id/share',
  requireAuth(),
  resolveUser,
  validate(createShareLinkSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { expiresInHours } = req.body;

      const [attachment] = await db
        .select()
        .from(mediaAttachments)
        .where(eq(mediaAttachments.id, id))
        .limit(1);

      if (!attachment) {
        res.status(404).json({ error: 'Media attachment not found' });
        return;
      }

      const shareToken = uuidv4();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      const [shareLink] = await db
        .insert(publicShareLinks)
        .values({
          mediaAttachmentId: id,
          shareToken,
          createdBy: req.userId!,
          expiresAt,
        })
        .returning();

      res.status(201).json({
        shareLink: {
          ...shareLink,
          url: `${req.protocol}://${req.get('host')}/api/v1/media/public/${shareToken}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/media/public/:shareToken - Access media via public share link
router.get(
  '/public/:shareToken',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shareToken } = req.params;

      const [shareLink] = await db
        .select()
        .from(publicShareLinks)
        .where(
          and(
            eq(publicShareLinks.shareToken, shareToken),
            isNull(publicShareLinks.revokedAt)
          )
        )
        .limit(1);

      if (!shareLink) {
        res.status(404).json({ error: 'Share link not found or revoked' });
        return;
      }

      if (new Date() > shareLink.expiresAt) {
        res.status(410).json({ error: 'Share link has expired' });
        return;
      }

      // Increment access count
      await db
        .update(publicShareLinks)
        .set({ accessCount: shareLink.accessCount + 1 })
        .where(eq(publicShareLinks.id, shareLink.id));

      const [attachment] = await db
        .select()
        .from(mediaAttachments)
        .where(eq(mediaAttachments.id, shareLink.mediaAttachmentId))
        .limit(1);

      if (!attachment || !attachment.originalStorageKey) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      const downloadUrl = await getDownloadPresignedUrl(attachment.originalStorageKey, 3600);

      res.json({
        downloadUrl,
        mimeType: attachment.mimeType,
        width: attachment.width,
        height: attachment.height,
        durationSeconds: attachment.durationSeconds,
        expiresAt: shareLink.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/media/share/:shareId - Revoke a share link
router.delete(
  '/share/:shareId',
  requireAuth(),
  resolveUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shareId } = req.params;

      const [shareLink] = await db
        .select()
        .from(publicShareLinks)
        .where(
          and(
            eq(publicShareLinks.id, shareId),
            eq(publicShareLinks.createdBy, req.userId!)
          )
        )
        .limit(1);

      if (!shareLink) {
        res.status(404).json({ error: 'Share link not found' });
        return;
      }

      await db
        .update(publicShareLinks)
        .set({ revokedAt: new Date() })
        .where(eq(publicShareLinks.id, shareId));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/media/:id/shares - List active share links for a media item
router.get(
  '/:id/shares',
  requireAuth(),
  resolveUser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const shares = await db
        .select()
        .from(publicShareLinks)
        .where(
          and(
            eq(publicShareLinks.mediaAttachmentId, id),
            eq(publicShareLinks.createdBy, req.userId!),
            isNull(publicShareLinks.revokedAt)
          )
        );

      res.json({ shares });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
