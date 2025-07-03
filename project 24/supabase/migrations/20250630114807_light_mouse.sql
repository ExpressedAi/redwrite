/*
  # Create media_contexts table

  1. New Tables
    - `media_contexts`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `name` (text) - file name
      - `type` (text) - MIME type
      - `size` (bigint) - file size in bytes
      - `thumbnail_url` (text, nullable) - thumbnail URL
      - `gemini_summary` (text, nullable) - brief summary from Gemini
      - `gemini_key_insights` (text, nullable) - key insights
      - `gemini_suggested_tags` (text, nullable) - suggested tags
      - `gemini_notable_features` (text, nullable) - notable features
      - `file_url` (text, nullable) - file reference URL

  2. Security
    - No RLS policies as requested
*/

CREATE TABLE IF NOT EXISTS media_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  thumbnail_url text,
  gemini_summary text,
  gemini_key_insights text,
  gemini_suggested_tags text,
  gemini_notable_features text,
  file_url text
);