# Pipo Backend

Express + TypeScript backend for the Pipo memory sharing app.

## Stack

- **Runtime**: Node.js + Express + TypeScript
- **Auth**: Clerk SDK
- **Database**: Neon Postgres + Drizzle ORM
- **Media Storage**: Cloudflare R2 (S3-compatible) via AWS SDK v3
- **Validation**: Zod

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials
2. Install dependencies: `npm install`
3. Push the database schema: `npm run db:push`
4. Start dev server: `npm run dev`

## API Endpoints

### Users
- `POST /api/v1/users/register` - Register after Clerk sign-up
- `GET /api/v1/users/me` - Get current user profile + usage
- `PATCH /api/v1/users/me` - Update profile

### Chats
- `POST /api/v1/chats` - Create a chat
- `GET /api/v1/chats` - List user's chats
- `GET /api/v1/chats/:chatId` - Get chat details + members
- `PATCH /api/v1/chats/:chatId` - Update chat (owner/admin)
- `DELETE /api/v1/chats/:chatId` - Soft-delete chat (owner)

### Messages
- `POST /api/v1/chats/:chatId/messages` - Send a message
- `GET /api/v1/chats/:chatId/messages` - List messages (cursor pagination)
- `GET /api/v1/chats/:chatId/messages/:messageId` - Get single message
- `DELETE /api/v1/chats/:chatId/messages/:messageId` - Soft-delete own message

### Media (R2)
- `POST /api/v1/media/upload-url` - Get presigned upload URL
- `POST /api/v1/media/upload-complete` - Confirm upload + create attachment
- `GET /api/v1/media/:id/download-url?quality=original|compressed` - Get download URL
- `POST /api/v1/media/:id/share` - Generate public share link (1-24h expiry)
- `GET /api/v1/media/public/:shareToken` - Access media via public link
- `DELETE /api/v1/media/share/:shareId` - Revoke share link
- `GET /api/v1/media/:id/shares` - List active share links

### Health
- `GET /health` - Health check

## Database Migrations

```bash
npm run db:generate  # Generate migration files from schema changes
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI
```
