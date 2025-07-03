import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xwzpbolmggxoajhfegqe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3enBib2xtZ2d4b2FqaGZlZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDczODcsImV4cCI6MjA2Njg4MzM4N30.7TN1X9y73AGjKD6RUqiCniNfzGkBq2ZfAkm_acAH65k';

// Debug logging to check if environment variables are loaded
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set in environment variables');
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not set in environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MediaContext {
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
}

export interface MediaAnalysisChunk {
  id: string;
  media_context_id: string;
  chunk_index: number;
  chunk_content?: string;
  summary?: string;
  key_insights?: string;
  suggested_tags?: string;
  notable_features?: string;
  created_at: string;
}

export interface GeneratedHtmlPage {
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
}