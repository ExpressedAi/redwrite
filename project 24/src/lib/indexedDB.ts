import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'my-app-db';
const DB_VERSION = 1;

interface MyAppDB extends DBSchema {
  media: {
    key: string;
    value: {
      id: string;
      created_at: string;
      name: string;
      type: string;
      size: number;
      thumbnail_url?: string;
      gemini_summary?: string;
      gemini_key_insights?: string;
      gemini_suggested_tags?: string;
      gemini_notable_features?: string;
      file_url?: string;
      user_tags?: string;
    };
    indexes: { 'by-created_at': string };
  };
  mediaAnalysisChunks: {
    key: string;
    value: {
      id: string;
      media_context_id: string;
      chunk_index: number;
      chunk_content?: string;
      summary?: string;
      key_insights?: string;
      suggested_tags?: string;
      notable_features?: string;
      created_at: string;
    };
    indexes: { 'by-media_context_id': string };
  };
  generatedHtmlPages: {
    key: string;
    value: {
      id: string;
      created_at: string;
      name: string;
      description?: string;
      html_content: string;
      public_url?: string;
      media_context_ids: string[];
      gemini_prompt?: string;
      status: 'draft' | 'published' | 'archived';
      file_size: number;
      view_count: number;
      last_viewed_at?: string;
    };
    indexes: { 'by-created_at': string };
  };
}

let db: IDBPDatabase<MyAppDB>;

export async function initDB() {
  if (db) {
    return;
  }

  db = await openDB<MyAppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('media')) {
        const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
        mediaStore.createIndex('by-created_at', 'created_at');
      }
      if (!db.objectStoreNames.contains('mediaAnalysisChunks')) {
        const chunksStore = db.createObjectStore('mediaAnalysisChunks', { keyPath: 'id' });
        chunksStore.createIndex('by-media_context_id', 'media_context_id');
      }
      if (!db.objectStoreNames.contains('generatedHtmlPages')) {
        const pagesStore = db.createObjectStore('generatedHtmlPages', { keyPath: 'id' });
        pagesStore.createIndex('by-created_at', 'created_at');
      }
    },
  });
}

export async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}
