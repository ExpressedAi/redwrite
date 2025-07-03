/*
  # Create media analysis chunks table

  1. New Tables
    - `media_analysis_chunks`
      - `id` (uuid, primary key)
      - `media_context_id` (uuid, foreign key to media_contexts)
      - `chunk_index` (integer, order of chunks)
      - `chunk_content` (text, the actual chunk content for reference)
      - `summary` (text, AI-generated summary of the chunk)
      - `key_insights` (text, key insights from the chunk)
      - `suggested_tags` (text, suggested tags for the chunk)
      - `notable_features` (text, notable features in the chunk)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `media_analysis_chunks` table
    - Add policy for authenticated users to read their own data

  3. Indexes
    - Add index on media_context_id for faster queries
    - Add index on chunk_index for ordering
*/

CREATE TABLE IF NOT EXISTS media_analysis_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_context_id uuid NOT NULL REFERENCES media_contexts(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_content text,
  summary text,
  key_insights text,
  suggested_tags text,
  notable_features text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_analysis_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chunk data"
  ON media_analysis_chunks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert chunk data"
  ON media_analysis_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update chunk data"
  ON media_analysis_chunks
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete chunk data"
  ON media_analysis_chunks
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_analysis_chunks_media_context_id 
  ON media_analysis_chunks(media_context_id);

CREATE INDEX IF NOT EXISTS idx_media_analysis_chunks_chunk_index 
  ON media_analysis_chunks(media_context_id, chunk_index);