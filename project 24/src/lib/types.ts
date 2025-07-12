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
