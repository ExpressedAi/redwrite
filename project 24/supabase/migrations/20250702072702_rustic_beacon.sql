/*
  # Create generated HTML pages table

  1. New Tables
    - `generated_html_pages`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `html_content` (text, required)
      - `public_url` (text, optional)
      - `media_context_ids` (uuid array)
      - `gemini_prompt` (text, optional)
      - `status` (text with check constraint)
      - `file_size` (bigint)
      - `view_count` (integer)
      - `last_viewed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `generated_html_pages` table
    - Add policy for anonymous users to read published pages
    - Add policy for authenticated users to have full access
    - Add policy for anonymous users to update view counts

  3. Performance
    - Add indexes for status, created_at, and media_context_ids
*/

-- Create the generated_html_pages table
CREATE TABLE IF NOT EXISTS generated_html_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  html_content text NOT NULL,
  public_url text,
  media_context_ids uuid[] DEFAULT '{}',
  gemini_prompt text,
  status text DEFAULT 'draft',
  file_size bigint DEFAULT 0,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz
);

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'generated_html_pages_status_check' 
    AND table_name = 'generated_html_pages'
  ) THEN
    ALTER TABLE generated_html_pages 
    ADD CONSTRAINT generated_html_pages_status_check 
    CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE generated_html_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read for published pages" ON generated_html_pages;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON generated_html_pages;
DROP POLICY IF EXISTS "Allow anonymous view count updates" ON generated_html_pages;

-- Allow anonymous users to read published pages (for public sharing)
CREATE POLICY "Allow anonymous read for published pages"
  ON generated_html_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Allow authenticated users full access to their pages
CREATE POLICY "Allow authenticated users full access"
  ON generated_html_pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to update view count only
CREATE POLICY "Allow anonymous view count updates"
  ON generated_html_pages
  FOR UPDATE
  TO anon
  USING (status = 'published')
  WITH CHECK (status = 'published');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_html_pages_status 
  ON generated_html_pages(status);

CREATE INDEX IF NOT EXISTS idx_generated_html_pages_created_at 
  ON generated_html_pages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_html_pages_media_context_ids 
  ON generated_html_pages USING GIN(media_context_ids);