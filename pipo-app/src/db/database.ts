import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('pipo.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      media_uri TEXT,
      media_local_uri TEXT,
      compressed_local_uri TEXT,
      media_mime_type TEXT,
      media_duration REAL,
      media_width INTEGER,
      media_height INTEGER,
      original_size_bytes INTEGER,
      compressed_size_bytes INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      id TEXT PRIMARY KEY NOT NULL,
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL,
      left_at INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    );

    CREATE TABLE IF NOT EXISTS message_queue (
      id TEXT PRIMARY KEY NOT NULL,
      message_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 5,
      next_retry_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS media_attachments (
      id TEXT PRIMARY KEY NOT NULL,
      message_id TEXT NOT NULL,
      original_storage_key TEXT,
      compressed_storage_key TEXT,
      local_original_uri TEXT NOT NULL,
      local_compressed_uri TEXT,
      mime_type TEXT NOT NULL,
      original_size_bytes INTEGER NOT NULL DEFAULT 0,
      compressed_size_bytes INTEGER,
      width INTEGER,
      height INTEGER,
      duration_seconds REAL,
      upload_status TEXT NOT NULL DEFAULT 'pending',
      upload_progress REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_message_queue_next_retry ON message_queue(next_retry_at);
    CREATE INDEX IF NOT EXISTS idx_media_attachments_message_id ON media_attachments(message_id);
    CREATE INDEX IF NOT EXISTS idx_media_attachments_upload_status ON media_attachments(upload_status);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
